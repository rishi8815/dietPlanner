/**
 * Local Storage Service
 * 
 * Uses AsyncStorage for offline data persistence.
 * Works alongside Redis cache for a multi-layer caching strategy:
 * 
 * 1. Memory (React state) - Instant access
 * 2. Local (AsyncStorage) - Offline access, persists across sessions
 * 3. Remote (Redis) - Cross-device sync
 * 4. Database (Supabase) - Source of truth
 * 
 * This service provides:
 * - Offline data access
 * - Faster app startup (load from local before network)
 * - Reduced API calls
 * - Background sync when online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// ============================================
// Configuration
// ============================================

const STORAGE_PREFIX = '@n8n:';
const CACHE_VERSION = 'v1';

// TTL for local cache (in milliseconds)
const LOCAL_TTL = {
    meals: 24 * 60 * 60 * 1000,      // 24 hours
    profile: 7 * 24 * 60 * 60 * 1000, // 7 days
    settings: 30 * 24 * 60 * 60 * 1000, // 30 days
    default: 24 * 60 * 60 * 1000,    // 24 hours
};

// ============================================
// Types
// ============================================

interface CachedItem<T> {
    data: T;
    timestamp: number;
    version: string;
}

interface SyncQueueItem {
    id: string;
    action: 'add' | 'update' | 'delete' | 'clear';
    payload: unknown;
    timestamp: number;
}

// ============================================
// Key Builders
// ============================================

const keys = {
    // Data keys
    meals: (userId: string, date: string) =>
        `${STORAGE_PREFIX}${CACHE_VERSION}:meals:${userId}:${date}`,

    mealsMonth: (userId: string, month: string) =>
        `${STORAGE_PREFIX}${CACHE_VERSION}:meals:${userId}:month:${month}`,

    profile: (userId: string) =>
        `${STORAGE_PREFIX}${CACHE_VERSION}:profile:${userId}`,

    settings: (userId: string) =>
        `${STORAGE_PREFIX}${CACHE_VERSION}:settings:${userId}`,

    // Sync queue
    syncQueue: () => `${STORAGE_PREFIX}sync:queue`,

    // Last sync timestamp
    lastSync: (type: string, userId: string) =>
        `${STORAGE_PREFIX}sync:last:${type}:${userId}`,

    // All keys for a user (for cleanup)
    userPattern: (userId: string) =>
        `${STORAGE_PREFIX}${CACHE_VERSION}:*:${userId}`,
};

// ============================================
// Core Functions
// ============================================

/**
 * Get item from local storage
 */
async function get<T>(key: string, ttl?: number): Promise<T | null> {
    try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) return null;

        const cached: CachedItem<T> = JSON.parse(raw);

        // Check version
        if (cached.version !== CACHE_VERSION) {
            await AsyncStorage.removeItem(key);
            return null;
        }

        // Check TTL
        const maxAge = ttl || LOCAL_TTL.default;
        if (Date.now() - cached.timestamp > maxAge) {
            // Expired - but still return for offline use
            // Just mark it as stale
            console.log(`📦 Local cache stale: ${key}`);
        }

        return cached.data;
    } catch (error) {
        console.error('Local storage get error:', error);
        return null;
    }
}

/**
 * Set item in local storage
 */
async function set<T>(key: string, data: T): Promise<boolean> {
    try {
        const cached: CachedItem<T> = {
            data,
            timestamp: Date.now(),
            version: CACHE_VERSION,
        };
        await AsyncStorage.setItem(key, JSON.stringify(cached));
        return true;
    } catch (error) {
        console.error('Local storage set error:', error);
        return false;
    }
}

/**
 * Remove item from local storage
 */
async function remove(key: string): Promise<boolean> {
    try {
        await AsyncStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Local storage remove error:', error);
        return false;
    }
}

/**
 * Clear all cached data for a user
 */
async function clearUserData(userId: string): Promise<void> {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        const userKeys = allKeys.filter(key =>
            key.includes(`:${userId}:`) || key.endsWith(`:${userId}`)
        );

        if (userKeys.length > 0) {
            await AsyncStorage.multiRemove(userKeys);
        }
    } catch (error) {
        console.error('Clear user data error:', error);
    }
}

// ============================================
// Network Status
// ============================================

let isOnline = true;

// Subscribe to network changes
NetInfo.addEventListener(state => {
    isOnline = state.isConnected ?? true;
    console.log(`🌐 Network: ${isOnline ? 'Online' : 'Offline'}`);
});

/**
 * Check if device is online
 */
async function checkOnline(): Promise<boolean> {
    try {
        const state = await NetInfo.fetch();
        isOnline = state.isConnected ?? true;
        return isOnline;
    } catch {
        return true; // Assume online if check fails
    }
}

/**
 * Get current online status (sync, doesn't make network call)
 */
function getOnlineStatus(): boolean {
    return isOnline;
}

// ============================================
// Sync Queue (for offline mutations)
// ============================================

/**
 * Add item to sync queue (for offline mutations)
 */
async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp'>): Promise<void> {
    try {
        const queue = await getSyncQueue();
        const newItem: SyncQueueItem = {
            ...item,
            id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
        };
        queue.push(newItem);
        await AsyncStorage.setItem(keys.syncQueue(), JSON.stringify(queue));
    } catch (error) {
        console.error('Add to sync queue error:', error);
    }
}

/**
 * Get sync queue
 */
async function getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
        const raw = await AsyncStorage.getItem(keys.syncQueue());
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Clear sync queue
 */
async function clearSyncQueue(): Promise<void> {
    await AsyncStorage.removeItem(keys.syncQueue());
}

/**
 * Remove item from sync queue
 */
async function removeFromSyncQueue(id: string): Promise<void> {
    try {
        const queue = await getSyncQueue();
        const filtered = queue.filter(item => item.id !== id);
        await AsyncStorage.setItem(keys.syncQueue(), JSON.stringify(filtered));
    } catch (error) {
        console.error('Remove from sync queue error:', error);
    }
}

// ============================================
// Meals-Specific Functions
// ============================================

import type { MealItem, DailyMeals } from '@/services/DailyMealsService';

/**
 * Get meals for a date from local storage
 */
async function getMealsLocal(userId: string, date: string): Promise<DailyMeals | null> {
    const key = keys.meals(userId, date);
    return get<DailyMeals>(key, LOCAL_TTL.meals);
}

/**
 * Save meals to local storage
 */
async function setMealsLocal(userId: string, date: string, meals: DailyMeals): Promise<boolean> {
    const key = keys.meals(userId, date);
    return set(key, meals);
}

/**
 * Get dates with meals for a month
 */
async function getDatesWithMealsLocal(userId: string, month: string): Promise<string[]> {
    const key = keys.mealsMonth(userId, month);
    return (await get<string[]>(key, LOCAL_TTL.meals)) || [];
}

/**
 * Save dates with meals for a month
 */
async function setDatesWithMealsLocal(userId: string, month: string, dates: string[]): Promise<boolean> {
    const key = keys.mealsMonth(userId, month);
    return set(key, dates);
}

/**
 * Queue meal mutation for offline sync
 */
async function queueMealMutation(
    userId: string,
    date: string,
    action: 'add' | 'update' | 'delete' | 'clear',
    payload: { meals?: MealItem[]; mealId?: string }
): Promise<void> {
    await addToSyncQueue({
        action,
        payload: { userId, date, ...payload },
    });
}

// ============================================
// Profile-Specific Functions
// ============================================

import type { UserProfile } from '@/services/ProfileService';

/**
 * Get profile from local storage
 */
async function getProfileLocal(userId: string): Promise<UserProfile | null> {
    const key = keys.profile(userId);
    return get<UserProfile>(key, LOCAL_TTL.profile);
}

/**
 * Save profile to local storage
 */
async function setProfileLocal(userId: string, profile: UserProfile): Promise<boolean> {
    const key = keys.profile(userId);
    return set(key, profile);
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get storage size estimate
 */
async function getStorageSize(): Promise<{ keys: number; sizeKB: number }> {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        const appKeys = allKeys.filter(k => k.startsWith(STORAGE_PREFIX));

        let totalSize = 0;
        for (const key of appKeys) {
            const value = await AsyncStorage.getItem(key);
            totalSize += (value?.length || 0);
        }

        return {
            keys: appKeys.length,
            sizeKB: Math.round(totalSize / 1024),
        };
    } catch {
        return { keys: 0, sizeKB: 0 };
    }
}

/**
 * Clean up expired items
 */
async function cleanupExpired(): Promise<number> {
    try {
        const allKeys = await AsyncStorage.getAllKeys();
        const appKeys = allKeys.filter(k => k.startsWith(STORAGE_PREFIX));

        let cleaned = 0;
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days max

        for (const key of appKeys) {
            if (key.includes('sync:')) continue; // Don't clean sync queue

            try {
                const raw = await AsyncStorage.getItem(key);
                if (raw) {
                    const cached = JSON.parse(raw);
                    if (cached.timestamp && now - cached.timestamp > maxAge) {
                        await AsyncStorage.removeItem(key);
                        cleaned++;
                    }
                }
            } catch {
                // Remove corrupt items
                await AsyncStorage.removeItem(key);
                cleaned++;
            }
        }

        return cleaned;
    } catch {
        return 0;
    }
}

// ============================================
// Export
// ============================================

export const localStorage = {
    // Core
    get,
    set,
    remove,
    clearUserData,

    // Network
    checkOnline,
    getOnlineStatus,

    // Sync queue
    addToSyncQueue,
    getSyncQueue,
    clearSyncQueue,
    removeFromSyncQueue,

    // Meals
    getMealsLocal,
    setMealsLocal,
    getDatesWithMealsLocal,
    setDatesWithMealsLocal,
    queueMealMutation,

    // Profile
    getProfileLocal,
    setProfileLocal,

    // Utils
    getStorageSize,
    cleanupExpired,

    // Keys
    keys,
};

export default localStorage;
