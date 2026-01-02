/**
 * Redis Key Builder
 * 
 * Centralized key management for consistent key naming across the application.
 * Best practices:
 * - Use colons (:) as separators
 * - Prefix with app name for multi-tenant support
 * - Include version for cache invalidation on schema changes
 */

import { KEY_PREFIX } from './config';
import type { CacheNamespace, KeyBuilder } from './types';

const { app, cache, rateLimit, session, lock, tag, separator } = KEY_PREFIX;

/**
 * Build a prefixed key with consistent formatting
 */
function buildKey(...parts: (string | number)[]): string {
    return parts.filter(Boolean).join(separator);
}

/**
 * Key builder implementation
 */
export const keys: KeyBuilder = {
    /**
     * Build a cache key
     * Format: {app}:{cache}:{namespace}:{...parts}
     * Example: n8n:cache:profile:user123
     */
    cache(namespace: CacheNamespace, ...parts: string[]): string {
        return buildKey(app, cache, namespace, ...parts);
    },

    /**
     * Build a rate limit key
     * Format: {app}:{rl}:{identifier}:{endpoint?}
     * Example: n8n:rl:user123:gemini
     */
    rateLimit(identifier: string, endpoint?: string): string {
        return buildKey(app, rateLimit, identifier, endpoint || 'global');
    },

    /**
     * Build a session key
     * Format: {app}:{session}:{userId}
     * Example: n8n:session:user123
     */
    session(userId: string): string {
        return buildKey(app, session, userId);
    },

    /**
     * Build a lock key (for distributed locking)
     * Format: {app}:{lock}:{resource}
     * Example: n8n:lock:meal-update-user123
     */
    lock(resource: string): string {
        return buildKey(app, lock, resource);
    },

    /**
     * Build a tag key (for cache tag invalidation)
     * Format: {app}:{tag}:{tagName}
     * Example: n8n:tag:user:123
     */
    tag(tagName: string): string {
        return buildKey(app, tag, tagName);
    },
};

// ============================================
// Commonly Used Key Generators
// ============================================

/**
 * Generate cache keys for specific use cases
 */
export const cacheKeys = {
    // Profile cache keys
    userProfile: (userId: string) => keys.cache('profile', userId),

    // Meals cache keys
    mealsForDate: (userId: string, date: string) =>
        keys.cache('meals', userId, date),

    mealsForRange: (userId: string, startDate: string, endDate: string) =>
        keys.cache('meals', userId, `range:${startDate}:${endDate}`),

    datesWithMeals: (userId: string, month: string) =>
        keys.cache('meals', userId, `dates:${month}`),

    // Nutrition cache keys
    dailyNutrition: (userId: string, date: string) =>
        keys.cache('nutrition', userId, date),

    nutritionSummary: (userId: string, period: 'week' | 'month') =>
        keys.cache('nutrition', userId, `summary:${period}`),

    // Gemini cache keys (AI responses)
    geminiMealPlan: (userId: string, date: string) =>
        keys.cache('gemini', userId, `plan:${date}`),

    geminiNutritionAdvice: (userId: string, hash: string) =>
        keys.cache('gemini', userId, `advice:${hash}`),

    // Storage cache keys
    storageUrl: (path: string) =>
        keys.cache('storage', path.replace(/\//g, ':')),
};

/**
 * Generate rate limit keys for specific endpoints
 */
export const rateLimitKeys = {
    global: (identifier: string) =>
        keys.rateLimit(identifier, 'global'),

    gemini: (identifier: string) =>
        keys.rateLimit(identifier, 'gemini'),

    profile: (identifier: string) =>
        keys.rateLimit(identifier, 'profile'),

    meals: (identifier: string) =>
        keys.rateLimit(identifier, 'meals'),

    read: (identifier: string) =>
        keys.rateLimit(identifier, 'read'),

    write: (identifier: string) =>
        keys.rateLimit(identifier, 'write'),
};

/**
 * Generate tag keys for cache invalidation
 */
export const tagKeys = {
    // User-specific tags (invalidate all user data)
    user: (userId: string) => keys.tag(`user:${userId}`),

    // Resource-specific tags
    userMeals: (userId: string) => keys.tag(`meals:${userId}`),
    userProfile: (userId: string) => keys.tag(`profile:${userId}`),
    userNutrition: (userId: string) => keys.tag(`nutrition:${userId}`),

    // Date-specific tags (invalidate data for a specific date)
    dateData: (date: string) => keys.tag(`date:${date}`),
};
