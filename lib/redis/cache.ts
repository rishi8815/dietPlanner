/**
 * Redis Cache Service
 * 
 * High-level caching abstraction with:
 * - Automatic serialization/deserialization
 * - TTL management
 * - Cache invalidation by tags
 * - Stale-while-revalidate pattern
 * - Cache statistics
 */

import { redis, isRedisAvailable } from './provider';
import { CACHE_TTL } from './config';
import { keys, cacheKeys, tagKeys } from './keys';
import type { CacheOptions, CachedData, CacheStats, CacheNamespace } from './types';

// ============================================
// Cache Statistics (in-memory for this session)
// ============================================

const stats = {
    hits: 0,
    misses: 0,
};

// ============================================
// Core Cache Functions
// ============================================

/**
 * Get a value from cache
 * 
 * @param key - Cache key
 * @returns Cached value or null if not found/expired
 */
export async function get<T>(key: string): Promise<T | null> {
    if (!isRedisAvailable()) {
        return null;
    }

    try {
        const cached = await redis.get<CachedData<T>>(key);

        if (!cached) {
            stats.misses++;
            return null;
        }

        // Check if data is expired
        const now = Date.now();
        if (cached.expiresAt < now) {
            stats.misses++;
            // Data expired, but we'll delete it lazily
            redis.del(key).catch(console.error);
            return null;
        }

        stats.hits++;
        return cached.data;
    } catch (error) {
        console.error('Cache get error:', error);
        stats.misses++;
        return null;
    }
}

/**
 * Set a value in cache
 * 
 * @param key - Cache key
 * @param data - Data to cache
 * @param options - Cache options (TTL, tags)
 */
export async function set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
): Promise<boolean> {
    if (!isRedisAvailable()) {
        return false;
    }

    try {
        const ttl = options.ttl || CACHE_TTL.default;
        const now = Date.now();

        const cachedData: CachedData<T> = {
            data,
            cachedAt: now,
            expiresAt: now + (ttl * 1000),
            tags: options.tags,
        };

        await redis.set(key, cachedData, { ex: ttl });

        // Store key reference in tag sets for invalidation
        if (options.tags?.length) {
            for (const tag of options.tags) {
                const tagKey = keys.tag(tag);
                await redis.lpush(tagKey, key);
                // Set TTL on tag to auto-cleanup
                await redis.expire(tagKey, ttl * 2);
            }
        }

        return true;
    } catch (error) {
        console.error('Cache set error:', error);
        return false;
    }
}

/**
 * Delete a value from cache
 */
export async function del(key: string): Promise<boolean> {
    if (!isRedisAvailable()) {
        return false;
    }

    try {
        await redis.del(key);
        return true;
    } catch (error) {
        console.error('Cache del error:', error);
        return false;
    }
}

/**
 * Delete multiple cache entries
 */
export async function delMany(...keys: string[]): Promise<number> {
    if (!isRedisAvailable() || keys.length === 0) {
        return 0;
    }

    try {
        return await redis.del(...keys);
    } catch (error) {
        console.error('Cache delMany error:', error);
        return 0;
    }
}

/**
 * Invalidate cache by tag
 * Deletes all cache entries associated with the given tag
 */
export async function invalidateByTag(tag: string): Promise<number> {
    if (!isRedisAvailable()) {
        return 0;
    }

    try {
        const tagKey = keys.tag(tag);
        const keysToDelete = await redis.lrange(tagKey, 0, -1);

        if (keysToDelete.length === 0) {
            return 0;
        }

        // Delete all cached entries
        const deletedCount = await redis.del(...keysToDelete);

        // Delete the tag key itself
        await redis.del(tagKey);

        return deletedCount;
    } catch (error) {
        console.error('Cache invalidateByTag error:', error);
        return 0;
    }
}

// ============================================
// Cache-Aside Pattern (getOrSet)
// ============================================

/**
 * Get from cache or execute fetcher and cache the result
 * 
 * This is the recommended pattern for most use cases.
 * 
 * @example
 * const profile = await cache.getOrSet(
 *   cacheKeys.userProfile(userId),
 *   () => fetchProfileFromDB(userId),
 *   { ttl: 1800, tags: [tagKeys.userProfile(userId)] }
 * );
 */
export async function getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    // Try to get from cache first
    const cached = await get<T>(key);
    if (cached !== null) {
        console.log(`🟢 CACHE HIT: ${key}`);
        return cached;
    }

    console.log(`🔴 CACHE MISS: ${key} - Fetching from database...`);

    // Cache miss - fetch fresh data
    const data = await fetcher();

    // Cache the result (don't await to not block return)
    set(key, data, options)
        .then(() => console.log(`💾 CACHED: ${key}`))
        .catch(console.error);

    return data;
}

/**
 * Get stale data while revalidating in background
 * 
 * Returns cached data immediately (even if stale) and refreshes in background.
 * Useful for data that doesn't need to be perfectly fresh.
 */
export async function getStaleWhileRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
): Promise<T> {
    if (!isRedisAvailable()) {
        return fetcher();
    }

    try {
        const cached = await redis.get<CachedData<T>>(key);
        const now = Date.now();
        const staleGrace = (options.staleWhileRevalidate || CACHE_TTL.staleGrace.default) * 1000;

        // If we have cached data
        if (cached) {
            const isExpired = cached.expiresAt < now;
            const isWithinGrace = cached.expiresAt + staleGrace > now;

            if (!isExpired) {
                // Fresh data
                stats.hits++;
                return cached.data;
            }

            if (isWithinGrace) {
                // Stale but within grace period - return stale and revalidate in background
                stats.hits++;
                revalidateInBackground(key, fetcher, options);
                return cached.data;
            }
        }

        // No cache or too stale - fetch fresh
        stats.misses++;
        const data = await fetcher();
        set(key, data, options).catch(console.error);
        return data;
    } catch (error) {
        console.error('Cache getStaleWhileRevalidate error:', error);
        return fetcher();
    }
}

/**
 * Revalidate cache entry in background
 */
async function revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
): Promise<void> {
    try {
        const data = await fetcher();
        await set(key, data, options);
    } catch (error) {
        console.error('Background revalidation error:', error);
    }
}

// ============================================
// Namespace-Specific Cache Functions
// ============================================

/**
 * Cache for user profiles
 */
export const profileCache = {
    async get(userId: string) {
        return get(cacheKeys.userProfile(userId));
    },

    async set<T>(userId: string, data: T) {
        return set(cacheKeys.userProfile(userId), data, {
            ttl: CACHE_TTL.namespaces.profile,
            tags: [tagKeys.userProfile(userId), tagKeys.user(userId)],
        });
    },

    async invalidate(userId: string) {
        return invalidateByTag(tagKeys.userProfile(userId));
    },
};

/**
 * Cache for meals
 */
export const mealsCache = {
    async getForDate<T>(userId: string, date: string) {
        return get<T>(cacheKeys.mealsForDate(userId, date));
    },

    async setForDate<T>(userId: string, date: string, data: T) {
        return set(cacheKeys.mealsForDate(userId, date), data, {
            ttl: CACHE_TTL.namespaces.meals,
            tags: [
                tagKeys.userMeals(userId),
                tagKeys.user(userId),
                tagKeys.dateData(date),
            ],
        });
    },

    async invalidateForUser(userId: string) {
        return invalidateByTag(tagKeys.userMeals(userId));
    },

    async invalidateForDate(userId: string, date: string) {
        return del(cacheKeys.mealsForDate(userId, date));
    },
};

/**
 * Cache for Gemini AI responses
 */
export const geminiCache = {
    async getMealPlan<T>(userId: string, date: string) {
        return get<T>(cacheKeys.geminiMealPlan(userId, date));
    },

    async setMealPlan<T>(userId: string, date: string, data: T) {
        return set(cacheKeys.geminiMealPlan(userId, date), data, {
            ttl: CACHE_TTL.namespaces.gemini,
            tags: [tagKeys.user(userId)],
        });
    },
};

// ============================================
// Cache Statistics
// ============================================

/**
 * Get cache statistics for this session
 */
export function getStats(): CacheStats {
    const total = stats.hits + stats.misses;
    return {
        hits: stats.hits,
        misses: stats.misses,
        hitRate: total > 0 ? stats.hits / total : 0,
    };
}

/**
 * Reset cache statistics
 */
export function resetStats(): void {
    stats.hits = 0;
    stats.misses = 0;
}

// ============================================
// Cache Utilities
// ============================================

/**
 * Warm up cache with frequently accessed data
 */
export async function warmUp<T>(
    keys: string[],
    fetchers: (() => Promise<T>)[],
    options: CacheOptions = {}
): Promise<void> {
    if (keys.length !== fetchers.length) {
        throw new Error('Keys and fetchers arrays must have the same length');
    }

    await Promise.all(
        keys.map((key, index) => getOrSet(key, fetchers[index], options))
    );
}

/**
 * Clear all cache (use with caution!)
 */
export async function clearAll(): Promise<void> {
    if (!isRedisAvailable()) {
        return;
    }

    try {
        // Use SCAN to find all keys with our prefix
        const pattern = `n8n:cache:*`;
        const allKeys: string[] = [];
        let cursor = 0;

        do {
            const [nextCursor, foundKeys] = await redis.scan(cursor, {
                match: pattern,
                count: 100
            });
            cursor = parseInt(nextCursor);
            allKeys.push(...foundKeys);
        } while (cursor !== 0);

        if (allKeys.length > 0) {
            await redis.del(...allKeys);
        }
    } catch (error) {
        console.error('Cache clearAll error:', error);
    }
}
