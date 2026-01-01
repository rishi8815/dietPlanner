import { supabase } from '@/lib/supabase';

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

class DailyMealsService {
    /**
     * Get meals for a specific date
     */
    async getMealsForDate(userId: string, date: string): Promise<DailyMeals | null> {
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
     * Create or update meals for a specific date
     */
    async saveMealsForDate(userId: string, date: string, meals: MealItem[]): Promise<DailyMeals | null> {
        // First check if record exists for this user/date
        const existing = await this.getMealsForDate(userId, date);

        if (existing) {
            // Update existing record
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

            return data;
        } else {
            // Insert new record
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

            return data;
        }
    }

    /**
     * Add a single meal to a specific date
     */
    async addMeal(userId: string, date: string, meal: Omit<MealItem, 'id' | 'added_at'>): Promise<DailyMeals | null> {
        // First, get existing meals for the date
        const existing = await this.getMealsForDate(userId, date);

        const newMeal: MealItem = {
            ...meal,
            id: this.generateMealId(),
            added_at: new Date().toISOString(),
        };

        const updatedMeals = existing?.meals ? [...existing.meals, newMeal] : [newMeal];

        return this.saveMealsForDate(userId, date, updatedMeals);
    }

    /**
     * Update a specific meal
     */
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

    /**
     * Remove a specific meal
     */
    async removeMeal(userId: string, date: string, mealId: string): Promise<DailyMeals | null> {
        const existing = await this.getMealsForDate(userId, date);

        if (!existing?.meals) {
            console.error('No meals found for date:', date);
            return null;
        }

        const updatedMeals = existing.meals.filter(meal => meal.id !== mealId);

        return this.saveMealsForDate(userId, date, updatedMeals);
    }

    /**
     * Clear all meals for a specific date
     */
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

        return true;
    }

    /**
     * Get dates that have meals (for calendar highlighting)
     */
    async getDatesWithMeals(userId: string, month: string): Promise<string[]> {
        // month format: YYYY-MM
        const startDate = `${month}-01`;
        const endDate = `${month}-31`; // Will work correctly even for shorter months

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

    /**
     * Check if a date is locked (past date that can't be edited)
     */
    async isDateLocked(userId: string, date: string): Promise<boolean> {
        const existing = await this.getMealsForDate(userId, date);
        return existing?.is_locked || false;
    }

    /**
     * Calculate total nutrition for a date
     */
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

    /**
     * Generate unique meal ID
     */
    private generateMealId(): string {
        return `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get default meal time based on meal type
     */
    getDefaultMealTime(mealType: string): string {
        const times: Record<string, string> = {
            breakfast: '08:00',
            lunch: '12:30',
            dinner: '19:00',
            snacks: '15:00',
        };
        return times[mealType] || '12:00';
    }

    /**
     * Format date for display
     */
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
}

export default new DailyMealsService();
