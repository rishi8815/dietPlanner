import { supabase } from '@/lib/supabase';
import { cache, cacheKeys, CACHE_TTL, shouldUseCache } from '@/lib/redis';
import { localStorage } from '@/lib/localStorage';

// Meal item structure stored in the jsonb array
export interface MealItem {
    id: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    time: string; // "08:00", "12:00", etc.
    added_at: string; // ISO timestamp
}

// Daily meals record from database
export interface DailyMeals {
    id: string;
    user_id: string;
    meal_date: string; // YYYY-MM-DD
    meals: MealItem[];
    is_locked: boolean;
    created_at: string;
    updated_at: string;
}

// Data for creating/updating meals
export interface DailyMealsData {
    meal_date: string;
    meals: MealItem[];
}

// Optimistic update callback types
export type OptimisticCallback = (meals: MealItem[]) => void;
export type ErrorCallback = (error: Error, originalMeals: MealItem[]) => void;

class DailyMealsService {
    /**
     * Get meals for a specific date
     * 
     * Cache Strategy (3-tier):
     * 1. Check AsyncStorage (local/offline) - instant
     * 2. Check Redis (server cache) - fast
     * 3. Fetch from Supabase (database) - slow
     * 
     * Also: If offline, returns local data only
     */
    async getMealsForDate(userId: string, date: string): Promise<DailyMeals | null> {
        // 1. Check if offline - return local only
        const isOnline = localStorage.getOnlineStatus();

        if (!isOnline) {
            console.log('📴 Offline: Loading from local storage');
            return localStorage.getMealsLocal(userId, date);
        }

        // 2. Try local storage first (instant)
        const localData = await localStorage.getMealsLocal(userId, date);

        // 3. Fetch fresh data in background, return local immediately if available
        if (localData) {
            console.log('📦 Local cache hit, refreshing in background');
            // Refresh in background
            this.refreshMealsInBackground(userId, date);
            return localData;
        }

        // 4. No local data - fetch from server
        return this.fetchAndCacheMeals(userId, date);
    }

    /**
     * Fetch meals and cache at all levels
     */
    private async fetchAndCacheMeals(userId: string, date: string): Promise<DailyMeals | null> {
        // Try Redis first, then database
        let data: DailyMeals | null = null;

        if (shouldUseCache()) {
            const cacheKey = cacheKeys.mealsForDate(userId, date);
            data = await cache.getOrSet<DailyMeals | null>(
                cacheKey,
                () => this.fetchMealsFromDB(userId, date),
                { ttl: CACHE_TTL.namespaces.meals }
            );
        } else {
            data = await this.fetchMealsFromDB(userId, date);
        }

        // Cache locally for offline access
        if (data) {
            localStorage.setMealsLocal(userId, date, data);
        }

        return data;
    }

    /**
     * Refresh meals from server in background
     */
    private async refreshMealsInBackground(userId: string, date: string): Promise<void> {
        try {
            const data = await this.fetchMealsFromDB(userId, date);
            if (data) {
                // Update local cache
                await localStorage.setMealsLocal(userId, date, data);

                // Update Redis cache
                if (shouldUseCache()) {
                    const cacheKey = cacheKeys.mealsForDate(userId, date);
                    cache.set(cacheKey, data, { ttl: CACHE_TTL.namespaces.meals });
                }
            }
        } catch (error) {
            console.error('Background refresh error:', error);
        }
    }

    /**
     * Fetch meals directly from database
     */
    private async fetchMealsFromDB(userId: string, date: string): Promise<DailyMeals | null> {
        const { data, error } = await supabase
            .from('daily_meals')
            .select('*')
            .eq('user_id', userId)
            .eq('meal_date', date)
            .maybeSingle();

        if (error) {
            console.error('Error fetching daily meals:', error);
            return null;
        }

        return data;
    }

    /**
     * Get meals for a date range (for calendar view)
     */
    async getMealsForDateRange(
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<DailyMeals[]> {
        const isOnline = localStorage.getOnlineStatus();

        if (!isOnline) {
            // Offline - we can't easily get range from local storage
            // Return empty for now, or implement local range query
            console.log('📴 Offline: Date range not available');
            return [];
        }

        if (!shouldUseCache()) {
            return this.fetchMealsRangeFromDB(userId, startDate, endDate);
        }

        const cacheKey = cacheKeys.mealsForRange(userId, startDate, endDate);

        return cache.getOrSet<DailyMeals[]>(
            cacheKey,
            () => this.fetchMealsRangeFromDB(userId, startDate, endDate),
            { ttl: CACHE_TTL.namespaces.meals }
        );
    }

    private async fetchMealsRangeFromDB(
        userId: string,
        startDate: string,
        endDate: string
    ): Promise<DailyMeals[]> {
        const { data, error } = await supabase
            .from('daily_meals')
            .select('*')
            .eq('user_id', userId)
            .gte('meal_date', startDate)
            .lte('meal_date', endDate)
            .order('meal_date', { ascending: true });

        if (error) {
            console.error('Error fetching meals for date range:', error);
            return [];
        }

        return data || [];
    }

    /**
     * OPTIMISTIC: Add a single meal to a specific date
     * Works offline by queueing mutations
     */
    async addMealOptimistic(
        userId: string,
        date: string,
        meal: Omit<MealItem, 'id' | 'added_at'>,
        currentMeals: MealItem[],
        onOptimisticUpdate: OptimisticCallback,
        onError?: ErrorCallback
    ): Promise<void> {
        const newMeal: MealItem = {
            ...meal,
            id: this.generateMealId(),
            added_at: new Date().toISOString(),
        };

        const optimisticMeals = [...currentMeals, newMeal];

        // Update UI immediately
        onOptimisticUpdate(optimisticMeals);

        // Update local storage immediately (for offline access)
        await this.updateLocalCache(userId, date, optimisticMeals);

        // Check if online
        const isOnline = localStorage.getOnlineStatus();

        if (!isOnline) {
            // Queue for sync when back online
            console.log('📴 Offline: Queueing meal add for sync');
            await localStorage.queueMealMutation(userId, date, 'add', { meals: optimisticMeals });
            return;
        }

        // Sync with server
        try {
            await this.saveMealsForDateBackground(userId, date, optimisticMeals);
            await this.updateRemoteCache(userId, date, optimisticMeals);
        } catch (error) {
            console.error('Error saving meal:', error);
            if (onError) {
                onError(error as Error, currentMeals);
            }
        }
    }

    /**
     * OPTIMISTIC: Update a specific meal
     */
    async updateMealOptimistic(
        userId: string,
        date: string,
        mealId: string,
        updates: Partial<MealItem>,
        currentMeals: MealItem[],
        onOptimisticUpdate: OptimisticCallback,
        onError?: ErrorCallback
    ): Promise<void> {
        const optimisticMeals = currentMeals.map(meal =>
            meal.id === mealId ? { ...meal, ...updates } : meal
        );

        onOptimisticUpdate(optimisticMeals);
        await this.updateLocalCache(userId, date, optimisticMeals);

        const isOnline = localStorage.getOnlineStatus();

        if (!isOnline) {
            console.log('📴 Offline: Queueing meal update for sync');
            await localStorage.queueMealMutation(userId, date, 'update', { meals: optimisticMeals });
            return;
        }

        try {
            await this.saveMealsForDateBackground(userId, date, optimisticMeals);
            await this.updateRemoteCache(userId, date, optimisticMeals);
        } catch (error) {
            console.error('Error updating meal:', error);
            if (onError) {
                onError(error as Error, currentMeals);
            }
        }
    }

    /**
     * OPTIMISTIC: Remove a specific meal
     */
    async removeMealOptimistic(
        userId: string,
        date: string,
        mealId: string,
        currentMeals: MealItem[],
        onOptimisticUpdate: OptimisticCallback,
        onError?: ErrorCallback
    ): Promise<void> {
        const optimisticMeals = currentMeals.filter(meal => meal.id !== mealId);

        onOptimisticUpdate(optimisticMeals);
        await this.updateLocalCache(userId, date, optimisticMeals);

        const isOnline = localStorage.getOnlineStatus();

        if (!isOnline) {
            console.log('📴 Offline: Queueing meal delete for sync');
            await localStorage.queueMealMutation(userId, date, 'delete', { meals: optimisticMeals });
            return;
        }

        try {
            await this.saveMealsForDateBackground(userId, date, optimisticMeals);
            await this.updateRemoteCache(userId, date, optimisticMeals);
        } catch (error) {
            console.error('Error removing meal:', error);
            if (onError) {
                onError(error as Error, currentMeals);
            }
        }
    }

    /**
     * OPTIMISTIC: Clear all meals for a specific date
     */
    async clearMealsOptimistic(
        userId: string,
        date: string,
        currentMeals: MealItem[],
        onOptimisticUpdate: OptimisticCallback,
        onError?: ErrorCallback
    ): Promise<void> {
        onOptimisticUpdate([]);

        // Clear local cache
        const key = localStorage.keys.meals(userId, date);
        await localStorage.remove(key);

        const isOnline = localStorage.getOnlineStatus();

        if (!isOnline) {
            console.log('📴 Offline: Queueing clear meals for sync');
            await localStorage.queueMealMutation(userId, date, 'clear', {});
            return;
        }

        try {
            const { error } = await supabase
                .from('daily_meals')
                .delete()
                .eq('user_id', userId)
                .eq('meal_date', date);

            if (error) throw error;

            // Clear Redis cache
            if (shouldUseCache()) {
                await cache.del(cacheKeys.mealsForDate(userId, date));
            }
        } catch (error) {
            console.error('Error clearing meals:', error);
            if (onError) {
                onError(error as Error, currentMeals);
            }
        }
    }

    /**
     * Update local cache (AsyncStorage)
     */
    private async updateLocalCache(userId: string, date: string, meals: MealItem[]): Promise<void> {
        const existing = await localStorage.getMealsLocal(userId, date);

        const updated: DailyMeals = existing ? {
            ...existing,
            meals,
            updated_at: new Date().toISOString(),
        } : {
            id: `local_${Date.now()}`,
            user_id: userId,
            meal_date: date,
            meals,
            is_locked: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        await localStorage.setMealsLocal(userId, date, updated);
    }

    /**
     * Update remote cache (Redis)
     */
    private async updateRemoteCache(userId: string, date: string, meals: MealItem[]): Promise<void> {
        if (!shouldUseCache()) return;

        const cacheKey = cacheKeys.mealsForDate(userId, date);
        const cachedData = await cache.get<DailyMeals>(cacheKey);

        if (cachedData) {
            const updated: DailyMeals = {
                ...cachedData,
                meals,
                updated_at: new Date().toISOString(),
            };
            await cache.set(cacheKey, updated, { ttl: CACHE_TTL.namespaces.meals });
        }
    }

    /**
     * Background save to database
     */
    private async saveMealsForDateBackground(
        userId: string,
        date: string,
        meals: MealItem[]
    ): Promise<void> {
        const { data: existing } = await supabase
            .from('daily_meals')
            .select('id')
            .eq('user_id', userId)
            .eq('meal_date', date)
            .maybeSingle();

        if (existing) {
            const { error } = await supabase
                .from('daily_meals')
                .update({
                    meals: meals,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id);

            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('daily_meals')
                .insert({
                    user_id: userId,
                    meal_date: date,
                    meals: meals,
                });

            if (error) throw error;
        }
    }

    /**
     * Sync offline mutations when back online
     * Call this when network status changes to online
     */
    async syncOfflineMutations(): Promise<number> {
        const queue = await localStorage.getSyncQueue();
        let synced = 0;

        console.log(`🔄 Syncing ${queue.length} offline mutations`);

        for (const item of queue) {
            try {
                const payload = item.payload as { userId: string; date: string; meals?: MealItem[] };

                if (item.action === 'clear') {
                    await supabase
                        .from('daily_meals')
                        .delete()
                        .eq('user_id', payload.userId)
                        .eq('meal_date', payload.date);
                } else if (payload.meals) {
                    await this.saveMealsForDateBackground(payload.userId, payload.date, payload.meals);
                }

                await localStorage.removeFromSyncQueue(item.id);
                synced++;
            } catch (error) {
                console.error(`Sync failed for item ${item.id}:`, error);
            }
        }

        console.log(`✅ Synced ${synced}/${queue.length} mutations`);
        return synced;
    }

    // ============================================
    // LEGACY METHODS (still work)
    // ============================================

    async saveMealsForDate(userId: string, date: string, meals: MealItem[]): Promise<DailyMeals | null> {
        const { data: existing } = await supabase
            .from('daily_meals')
            .select('id')
            .eq('user_id', userId)
            .eq('meal_date', date)
            .maybeSingle();

        let result: DailyMeals | null = null;

        if (existing) {
            const { data, error } = await supabase
                .from('daily_meals')
                .update({
                    meals: meals,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) {
                console.error('Error updating daily meals:', error);
                return null;
            }
            result = data;
        } else {
            const { data, error } = await supabase
                .from('daily_meals')
                .insert({
                    user_id: userId,
                    meal_date: date,
                    meals: meals,
                })
                .select()
                .single();

            if (error) {
                console.error('Error inserting daily meals:', error);
                return null;
            }
            result = data;
        }

        if (result) {
            // Update both caches
            await localStorage.setMealsLocal(userId, date, result);
            if (shouldUseCache()) {
                cache.del(cacheKeys.mealsForDate(userId, date)).catch(console.error);
            }
        }

        return result;
    }

    async addMeal(userId: string, date: string, meal: Omit<MealItem, 'id' | 'added_at'>): Promise<DailyMeals | null> {
        const existing = await this.getMealsForDate(userId, date);

        const newMeal: MealItem = {
            ...meal,
            id: this.generateMealId(),
            added_at: new Date().toISOString(),
        };

        const updatedMeals = existing?.meals ? [...existing.meals, newMeal] : [newMeal];
        return this.saveMealsForDate(userId, date, updatedMeals);
    }

    async updateMeal(
        userId: string,
        date: string,
        mealId: string,
        updates: Partial<MealItem>
    ): Promise<DailyMeals | null> {
        const existing = await this.getMealsForDate(userId, date);

        if (!existing?.meals) {
            console.error('No meals found for date:', date);
            return null;
        }

        const updatedMeals = existing.meals.map(meal =>
            meal.id === mealId ? { ...meal, ...updates } : meal
        );

        return this.saveMealsForDate(userId, date, updatedMeals);
    }

    async removeMeal(userId: string, date: string, mealId: string): Promise<DailyMeals | null> {
        const existing = await this.getMealsForDate(userId, date);

        if (!existing?.meals) {
            console.error('No meals found for date:', date);
            return null;
        }

        const updatedMeals = existing.meals.filter(meal => meal.id !== mealId);
        return this.saveMealsForDate(userId, date, updatedMeals);
    }

    async clearMealsForDate(userId: string, date: string): Promise<boolean> {
        const { error } = await supabase
            .from('daily_meals')
            .delete()
            .eq('user_id', userId)
            .eq('meal_date', date);

        if (error) {
            console.error('Error clearing meals:', error);
            return false;
        }

        // Clear both caches
        const localKey = localStorage.keys.meals(userId, date);
        await localStorage.remove(localKey);

        if (shouldUseCache()) {
            cache.del(cacheKeys.mealsForDate(userId, date)).catch(console.error);
        }

        return true;
    }

    async getDatesWithMeals(userId: string, month: string): Promise<string[]> {
        // Try local first
        const localDates = await localStorage.getDatesWithMealsLocal(userId, month);
        if (localDates.length > 0) {
            // Refresh in background
            this.refreshDatesInBackground(userId, month);
            return localDates;
        }

        // Fetch fresh
        const dates = await this.fetchDatesWithMealsFromDB(userId, month);

        // Cache locally
        if (dates.length > 0) {
            await localStorage.setDatesWithMealsLocal(userId, month, dates);
        }

        return dates;
    }

    private async refreshDatesInBackground(userId: string, month: string): Promise<void> {
        try {
            const dates = await this.fetchDatesWithMealsFromDB(userId, month);
            if (dates.length > 0) {
                await localStorage.setDatesWithMealsLocal(userId, month, dates);
            }
        } catch (error) {
            console.error('Background dates refresh error:', error);
        }
    }

    private async fetchDatesWithMealsFromDB(userId: string, month: string): Promise<string[]> {
        const startDate = `${month}-01`;
        const endDate = `${month}-31`;

        const { data, error } = await supabase
            .from('daily_meals')
            .select('meal_date')
            .eq('user_id', userId)
            .gte('meal_date', startDate)
            .lte('meal_date', endDate);

        if (error) {
            console.error('Error fetching dates with meals:', error);
            return [];
        }

        return data?.map(d => d.meal_date) || [];
    }

    async isDateLocked(userId: string, date: string): Promise<boolean> {
        const existing = await this.getMealsForDate(userId, date);
        return existing?.is_locked || false;
    }

    calculateTotalNutrition(meals: MealItem[]): {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    } {
        return meals.reduce((total, meal) => ({
            calories: total.calories + meal.calories,
            protein: total.protein + meal.protein,
            carbs: total.carbs + meal.carbs,
            fat: total.fat + meal.fat,
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    }

    private generateMealId(): string {
        return `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getDefaultMealTime(mealType: string): string {
        const times: Record<string, string> = {
            breakfast: '08:00',
            lunch: '12:30',
            dinner: '19:00',
            snacks: '15:00',
        };
        return times[mealType] || '12:00';
    }

    formatDateForDisplay(date: string): string {
        const d = new Date(date);
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        if (date === today) return 'Today';
        if (date === yesterday) return 'Yesterday';
        if (date === tomorrow) return 'Tomorrow';

        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }

    async refreshCache(userId: string, date: string): Promise<void> {
        // Clear all caches
        const localKey = localStorage.keys.meals(userId, date);
        await localStorage.remove(localKey);

        if (shouldUseCache()) {
            await cache.del(cacheKeys.mealsForDate(userId, date));
        }

        // Fetch fresh
        await this.getMealsForDate(userId, date);
    }
}

export default new DailyMealsService();
