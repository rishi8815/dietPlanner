/**
 * Redis Abstraction Layer - Type Definitions
 * 
 * This file contains all the TypeScript interfaces and types for the Redis module.
 * When migrating to a self-hosted Redis, these types remain unchanged.
 */

// ============================================
// Core Redis Interface
// ============================================

export interface RedisConfig {
    url: string;
    token: string;
    enableAutoPipelining?: boolean;
}

export interface RedisProvider {
    // Basic operations
    get<T = string>(key: string): Promise<T | null>;
    set(key: string, value: string | number | object, options?: SetOptions): Promise<'OK' | null>;
    del(...keys: string[]): Promise<number>;
    exists(...keys: string[]): Promise<number>;

    // Expiration
    expire(key: string, seconds: number): Promise<0 | 1>;
    ttl(key: string): Promise<number>;

    // Hash operations (for structured data)
    hget<T = string>(key: string, field: string): Promise<T | null>;
    hset(key: string, field: string, value: string | number): Promise<number>;
    hgetall<T = Record<string, string>>(key: string): Promise<T | null>;
    hdel(key: string, ...fields: string[]): Promise<number>;

    // List operations
    lpush(key: string, ...values: string[]): Promise<number>;
    rpush(key: string, ...values: string[]): Promise<number>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
    llen(key: string): Promise<number>;

    // Sorted set operations (for rate limiting)
    zadd(key: string, score: number, member: string): Promise<number>;
    zremrangebyscore(key: string, min: number, max: number): Promise<number>;
    zcard(key: string): Promise<number>;
    zcount(key: string, min: number, max: number): Promise<number>;

    // Increment operations
    incr(key: string): Promise<number>;
    incrby(key: string, increment: number): Promise<number>;

    // Key pattern operations
    keys(pattern: string): Promise<string[]>;
    scan(cursor: number, options?: ScanOptions): Promise<[string, string[]]>;

    // Pipeline for batch operations
    pipeline(): RedisPipeline;

    // Health check
    ping(): Promise<'PONG'>;
}

export interface SetOptions {
    ex?: number;      // Expiration in seconds
    px?: number;      // Expiration in milliseconds
    nx?: boolean;     // Only set if key doesn't exist
    xx?: boolean;     // Only set if key exists
}

export interface ScanOptions {
    match?: string;
    count?: number;
}

export interface RedisPipeline {
    get(key: string): RedisPipeline;
    set(key: string, value: string, options?: SetOptions): RedisPipeline;
    del(...keys: string[]): RedisPipeline;
    expire(key: string, seconds: number): RedisPipeline;
    incr(key: string): RedisPipeline;
    exec(): Promise<unknown[]>;
}

// ============================================
// Cache Types
// ============================================

export interface CacheOptions {
    ttl?: number;           // Time to live in seconds (default: 300 = 5 minutes)
    staleWhileRevalidate?: number;  // Grace period for stale data in seconds
    tags?: string[];        // Tags for cache invalidation
}

export interface CachedData<T> {
    data: T;
    cachedAt: number;       // Unix timestamp
    expiresAt: number;      // Unix timestamp
    tags?: string[];
}

export interface CacheStats {
    hits: number;
    misses: number;
    hitRate: number;
}

// ============================================
// Rate Limiting Types
// ============================================

export interface RateLimitConfig {
    identifier: string;     // User ID or IP
    limit: number;          // Maximum requests
    window: number;         // Time window in seconds
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;          // Unix timestamp when limit resets
    retryAfter?: number;    // Seconds until retry allowed
}

export type RateLimitAlgorithm = 'sliding-window' | 'fixed-window' | 'token-bucket';

// ============================================
// Key Namespace Types
// ============================================

export type CacheNamespace =
    | 'profile'
    | 'meals'
    | 'nutrition'
    | 'gemini'
    | 'storage';

export interface KeyBuilder {
    cache(namespace: CacheNamespace, ...parts: string[]): string;
    rateLimit(identifier: string, endpoint?: string): string;
    session(userId: string): string;
    lock(resource: string): string;
    tag(tagName: string): string;
}
