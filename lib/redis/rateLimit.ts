/**
 * Rate Limiting Service
 * 
 * Implements sliding window rate limiting using Redis sorted sets.
 * This is more accurate than fixed window and handles edge cases better.
 * 
 * Algorithm:
 * 1. Use sorted set with timestamp as score
 * 2. Remove entries outside the window
 * 3. Count remaining entries
 * 4. Allow/deny based on count vs limit
 */

import { redis, isRedisAvailable } from './provider';
import { RATE_LIMIT } from './config';
import { rateLimitKeys } from './keys';
import type { RateLimitConfig, RateLimitResult } from './types';

// ============================================
// Sliding Window Rate Limiter
// ============================================

/**
 * Check and apply rate limit using sliding window algorithm
 * 
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 * 
 * @example
 * const result = await checkRateLimit({
 *   identifier: userId,
 *   limit: 10,
 *   window: 60,
 * });
 * 
 * if (!result.success) {
 *   throw new Error(`Rate limited. Retry after ${result.retryAfter}s`);
 * }
 */
export async function checkRateLimit(
    config: RateLimitConfig
): Promise<RateLimitResult> {
    // If Redis is not available, allow the request (fail open)
    if (!isRedisAvailable()) {
        return {
            success: true,
            limit: config.limit,
            remaining: config.limit - 1,
            reset: Math.floor(Date.now() / 1000) + config.window,
        };
    }

    const key = rateLimitKeys.global(config.identifier);
    const now = Date.now();
    const windowStart = now - (config.window * 1000);
    const windowEnd = now + (config.window * 1000);

    try {
        // Use pipeline for efficiency
        const pipeline = redis.pipeline();

        // 1. Remove old entries outside the window
        await redis.zremrangebyscore(key, 0, windowStart);

        // 2. Count current entries in window
        const currentCount = await redis.zcard(key);

        // 3. Check if under limit
        if (currentCount >= config.limit) {
            // Get the oldest entry to calculate reset time
            const resetTime = Math.floor(windowEnd / 1000);
            const retryAfter = Math.ceil((windowStart + config.window * 1000 - now) / 1000);

            return {
                success: false,
                limit: config.limit,
                remaining: 0,
                reset: resetTime,
                retryAfter: Math.max(1, retryAfter),
            };
        }

        // 4. Add this request
        const member = `${now}:${Math.random().toString(36).slice(2)}`;
        await redis.zadd(key, now, member);

        // 5. Set TTL on the key (cleanup)
        await redis.expire(key, config.window * 2);

        return {
            success: true,
            limit: config.limit,
            remaining: config.limit - currentCount - 1,
            reset: Math.floor((now + config.window * 1000) / 1000),
        };
    } catch (error) {
        console.error('Rate limit error:', error);
        // Fail open on errors
        return {
            success: true,
            limit: config.limit,
            remaining: config.limit - 1,
            reset: Math.floor(Date.now() / 1000) + config.window,
        };
    }
}

// ============================================
// Pre-configured Rate Limiters
// ============================================

/**
 * Rate limit for Gemini AI calls
 * More restrictive due to API costs
 */
export async function rateLimitGemini(userId: string): Promise<RateLimitResult> {
    const { requests, window } = RATE_LIMIT.endpoints.gemini;
    return checkRateLimit({
        identifier: `gemini:${userId}`,
        limit: requests,
        window,
    });
}

/**
 * Rate limit for profile operations
 */
export async function rateLimitProfile(userId: string): Promise<RateLimitResult> {
    const { requests, window } = RATE_LIMIT.endpoints.profile;
    return checkRateLimit({
        identifier: `profile:${userId}`,
        limit: requests,
        window,
    });
}

/**
 * Rate limit for meals operations
 */
export async function rateLimitMeals(userId: string): Promise<RateLimitResult> {
    const { requests, window } = RATE_LIMIT.endpoints.meals;
    return checkRateLimit({
        identifier: `meals:${userId}`,
        limit: requests,
        window,
    });
}

/**
 * Rate limit for generic read operations
 */
export async function rateLimitRead(userId: string): Promise<RateLimitResult> {
    const { requests, window } = RATE_LIMIT.endpoints.read;
    return checkRateLimit({
        identifier: `read:${userId}`,
        limit: requests,
        window,
    });
}

/**
 * Rate limit for write operations
 */
export async function rateLimitWrite(userId: string): Promise<RateLimitResult> {
    const { requests, window } = RATE_LIMIT.endpoints.write;
    return checkRateLimit({
        identifier: `write:${userId}`,
        limit: requests,
        window,
    });
}

/**
 * Global rate limit (fallback)
 */
export async function rateLimitGlobal(userId: string): Promise<RateLimitResult> {
    const { requests, window } = RATE_LIMIT.default;
    return checkRateLimit({
        identifier: userId,
        limit: requests,
        window,
    });
}

// ============================================
// Rate Limit Utilities
// ============================================

/**
 * Reset rate limit for a specific identifier
 * Useful for admin operations or testing
 */
export async function resetRateLimit(identifier: string): Promise<boolean> {
    if (!isRedisAvailable()) {
        return false;
    }

    try {
        const key = rateLimitKeys.global(identifier);
        await redis.del(key);
        return true;
    } catch (error) {
        console.error('Reset rate limit error:', error);
        return false;
    }
}

/**
 * Get current rate limit status without incrementing counter
 */
export async function getRateLimitStatus(
    identifier: string,
    limit: number = RATE_LIMIT.default.requests,
    window: number = RATE_LIMIT.default.window
): Promise<{ used: number; remaining: number; resetIn: number }> {
    if (!isRedisAvailable()) {
        return { used: 0, remaining: limit, resetIn: window };
    }

    try {
        const key = rateLimitKeys.global(identifier);
        const now = Date.now();
        const windowStart = now - (window * 1000);

        // Remove old entries
        await redis.zremrangebyscore(key, 0, windowStart);

        // Count current
        const used = await redis.zcard(key);

        return {
            used,
            remaining: Math.max(0, limit - used),
            resetIn: window,
        };
    } catch (error) {
        console.error('Get rate limit status error:', error);
        return { used: 0, remaining: limit, resetIn: window };
    }
}

// ============================================
// Rate Limit Decorator/HOF
// ============================================

/**
 * Higher-order function to wrap any async function with rate limiting
 * 
 * @example
 * const rateLimitedFetch = withRateLimit(
 *   fetchData,
 *   { identifier: userId, limit: 10, window: 60 }
 * );
 */
export function withRateLimit<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    config: RateLimitConfig
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        const result = await checkRateLimit(config);

        if (!result.success) {
            throw new RateLimitError(
                `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
                result
            );
        }

        return fn(...args) as Promise<ReturnType<T>>;
    };
}

/**
 * Custom error class for rate limit errors
 */
export class RateLimitError extends Error {
    public rateLimitResult: RateLimitResult;

    constructor(message: string, result: RateLimitResult) {
        super(message);
        this.name = 'RateLimitError';
        this.rateLimitResult = result;
    }
}

// ============================================
// Rate Limit Headers Helper
// ============================================

/**
 * Generate standard rate limit headers for HTTP responses
 * Useful if you have an API server
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
        ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {}),
    };
}
