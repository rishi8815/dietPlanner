/**
 * Redis Configuration
 * 
 * Centralized configuration for Redis.
 * OPTIMIZED FOR UPSTASH FREE TIER (500k requests/month)
 * 
 * Budget: ~16,600 requests/day = ~700 requests/hour
 */

import type { CacheNamespace } from './types';

// ============================================
// Environment Configuration
// ============================================

export const REDIS_CONFIG = {
    // Current provider: 'upstash' | 'self-hosted' | 'redis-cloud'
    provider: 'upstash' as const,

    // Upstash REST API credentials
    upstash: {
        url: process.env.EXPOP_PUBLIC_UPSTASH_REDIS_REST_URL || '',
        token: process.env.EXPOP_PUBLIC_UPSTASH_REDIS_REST_TOKEN || '',
    },

    // IMPORTANT: Disable features to save requests
    features: {
        // Enable caching (main feature - keep enabled)
        caching: true,

        // DISABLED - Rate limiting uses 3-4 commands per check
        // Enable only if you have abuse issues
        rateLimiting: false,

        // DISABLED - Tag-based invalidation uses extra commands
        // Uses simple key deletion instead
        tagInvalidation: false,

        // Enable debug logging in development
        debugLogging: __DEV__ ?? false,
    },

    // Self-hosted Redis configuration (for future migration)
    // Uncomment and configure when migrating to VPS
    // selfHosted: {
    //     host: process.env.REDIS_HOST || 'localhost',
    //     port: parseInt(process.env.REDIS_PORT || '6379'),
    //     password: process.env.REDIS_PASSWORD,
    //     db: parseInt(process.env.REDIS_DB || '0'),
    //     tls: process.env.REDIS_TLS === 'true',
    // },
} as const;

// ============================================
// Cache TTL Configuration (in seconds)
// INCREASED TTLs to reduce cache misses and Redis requests
// ============================================

export const CACHE_TTL = {
    // Short-lived cache (5-15 minutes)
    short: 300,          // 5 minutes (was 1 minute)

    // Medium cache (30 minutes - 1 hour)
    medium: 1800,        // 30 minutes (was 5 minutes)
    default: 1800,       // 30 minutes (was 5 minutes)

    // Long cache (2-24 hours)
    long: 7200,          // 2 hours (was 1 hour)
    veryLong: 86400,     // 24 hours (unchanged)

    // Namespace-specific TTLs - INCREASED for fewer requests
    namespaces: {
        profile: 7200,       // 2 hours (was 30 minutes) - profiles rarely change
        meals: 1800,         // 30 minutes (was 5 minutes) - main data
        nutrition: 7200,     // 2 hours (was 1 hour) - derived data
        gemini: 86400,       // 24 hours (unchanged) - AI responses cached long
        storage: 7200,       // 2 hours (was 30 minutes)
    } as Record<CacheNamespace, number>,

    // Stale-while-revalidate grace periods - INCREASED
    staleGrace: {
        default: 600,        // 10 minutes (was 1 minute)
        profile: 1800,       // 30 minutes (was 5 minutes)
        meals: 300,          // 5 minutes (was 30 seconds)
    },
} as const;

// ============================================
// Rate Limiting Configuration
// NOTE: DISABLED BY DEFAULT to save requests
// Each rate limit check uses 3-4 Redis commands
// ============================================

export const RATE_LIMIT = {
    // Master switch - DISABLED to save requests
    enabled: false,

    // Default limits (if enabled)
    default: {
        requests: 100,
        window: 60,
    },

    // Endpoint-specific limits (if enabled)
    endpoints: {
        gemini: { requests: 10, window: 60 },
        profile: { requests: 20, window: 60 },
        meals: { requests: 50, window: 60 },
        read: { requests: 100, window: 60 },
        write: { requests: 30, window: 60 },
    },

    burstMultiplier: 1.2,
} as const;

// ============================================
// Key Prefix Configuration
// ============================================

export const KEY_PREFIX = {
    // Application prefix
    app: 'n8n',

    // Feature prefixes
    cache: 'c',      // Shortened from 'cache'
    rateLimit: 'r',  // Shortened from 'rl'
    session: 's',    // Shortened from 'session'
    lock: 'l',       // Shortened from 'lock'
    tag: 't',        // Shortened from 'tag'

    // Separator for key parts
    separator: ':',
} as const;

// ============================================
// Performance Settings
// ============================================

export const PERFORMANCE = {
    // Enable request pipelining for batch operations
    enablePipelining: true,

    // Maximum items in a single batch operation
    maxBatchSize: 100,

    // Connection timeout in milliseconds
    connectionTimeout: 5000,

    // Command timeout in milliseconds
    commandTimeout: 3000,

    // Retry configuration
    retry: {
        maxRetries: 2,       // Reduced from 3
        initialDelay: 100,
        maxDelay: 1000,
    },
} as const;

// ============================================
// Request Budget Tracking
// ============================================

export const BUDGET = {
    // Monthly limit
    monthlyLimit: 500000,

    // Daily budget (500k / 30 days)
    dailyBudget: 16667,

    // Hourly budget (daily / 24)
    hourlyBudget: 694,

    // Estimated commands per operation
    commandsPerOperation: {
        cacheGet: 1,
        cacheSet: 1,
        cacheGetOrSet: 2,      // 1 GET + 1 SET on miss
        cacheInvalidate: 2,    // 1 DEL + potential tag cleanup
        rateLimitCheck: 4,     // ZREMRANGEBYSCORE + ZCARD + ZADD + EXPIRE
    },
} as const;

// Helper to check if we should use Redis for an operation
export function shouldUseCache(): boolean {
    return REDIS_CONFIG.features.caching;
}

export function shouldRateLimit(): boolean {
    return REDIS_CONFIG.features.rateLimiting && RATE_LIMIT.enabled;
}
