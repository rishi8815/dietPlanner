/**
 * Redis Module - Main Entry Point
 * 
 * This is the public API for the Redis module.
 * Import from here for a clean interface.
 * 
 * @example
 * import { cache, rateLimit, redis } from '@/lib/redis';
 * 
 * // Caching
 * const data = await cache.getOrSet(key, fetcher, { ttl: 300 });
 * 
 * // Rate limiting
 * const result = await rateLimit.checkRateLimit({ identifier, limit, window });
 */

// Re-export types
export type {
    RedisConfig,
    RedisProvider,
    SetOptions,
    CacheOptions,
    CachedData,
    CacheStats,
    RateLimitConfig,
    RateLimitResult,
    CacheNamespace,
    KeyBuilder,
} from './types';

// Re-export configuration
export {
    REDIS_CONFIG,
    CACHE_TTL,
    RATE_LIMIT,
    KEY_PREFIX,
    PERFORMANCE,
    BUDGET,
    shouldUseCache,
    shouldRateLimit,
} from './config';

// Re-export key builders
export { keys, cacheKeys, rateLimitKeys, tagKeys } from './keys';

// Re-export provider
export { redis, getRedisProvider, isRedisAvailable } from './provider';

// Re-export cache functions
export * as cache from './cache';

// Re-export rate limit functions
export * as rateLimit from './rateLimit';

// ============================================
// Convenience Exports
// ============================================

// Common cache operations (for quick access)
export {
    get as cacheGet,
    set as cacheSet,
    del as cacheDel,
    getOrSet as cacheGetOrSet,
    invalidateByTag as cacheInvalidateByTag,
    profileCache,
    mealsCache,
    geminiCache,
    getStats as getCacheStats,
} from './cache';

// Common rate limit operations (for quick access)
export {
    checkRateLimit,
    rateLimitGemini,
    rateLimitProfile,
    rateLimitMeals,
    rateLimitRead,
    rateLimitWrite,
    rateLimitGlobal,
    RateLimitError,
    withRateLimit,
} from './rateLimit';
