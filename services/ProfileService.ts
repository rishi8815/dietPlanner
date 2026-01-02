import { supabase } from '@/lib/supabase';
import {
    cache,
    cacheKeys,
    tagKeys,
    rateLimitProfile,
    rateLimitWrite,
    CACHE_TTL
} from '@/lib/redis';

export interface UserProfile {
    id: string;
    name: string | null;
    gender: string | null;
    age: number | null;
    height_cm: number | null;
    weight_kg: number | null;
    goal: string | null;
    activity_level: string | null;
    diet_type: string | null;
    allergies: string[] | null;
    disliked_foods: string[] | null;
    daily_calories_target: number | null;
    daily_protein_target: number | null;
    plan: string | null;
    onboarding_completed: boolean;
    created_at: string | null;
    updated_at: string | null;
}

export interface ProfileUpdateData {
    name?: string;
    gender?: string;
    age?: number;
    height_cm?: number;
    weight_kg?: number;
    goal?: string;
    activity_level?: string;
    diet_type?: string;
    allergies?: string[];
    disliked_foods?: string[];
    daily_calories_target?: number;
    daily_protein_target?: number;
    plan?: string;
    onboarding_completed?: boolean;
}

class ProfileService {
    /**
     * Get the current user's profile
     * Uses Redis caching with stale-while-revalidate pattern
     */
    async getProfile(userId: string): Promise<UserProfile | null> {
        // Apply rate limiting
        const rateLimitResult = await rateLimitProfile(userId);
        if (!rateLimitResult.success) {
            console.warn(`Rate limited: ${rateLimitResult.remaining} requests remaining`);
        }

        const cacheKey = cacheKeys.userProfile(userId);

        // Use stale-while-revalidate for better UX
        // Profile data doesn't change often, so stale data is acceptable briefly
        return cache.getStaleWhileRevalidate<UserProfile | null>(
            cacheKey,
            async () => {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', userId)
                        .maybeSingle();

                    if (error) {
                        // PGRST116 means no rows found, which is expected for new users
                        if (error.code === 'PGRST116') {
                            return null;
                        }
                        console.error('Error fetching profile:', error);
                        return null;
                    }

                    return data as UserProfile | null;
                } catch (error) {
                    console.error('Error in getProfile:', error);
                    return null;
                }
            },
            {
                ttl: CACHE_TTL.namespaces.profile,
                staleWhileRevalidate: CACHE_TTL.staleGrace.profile,
                tags: [tagKeys.userProfile(userId), tagKeys.user(userId)],
            }
        );
    }

    /**
     * Create a new profile for a user
     */
    async createProfile(userId: string): Promise<UserProfile | null> {
        // Rate limit write operations
        const rateLimitResult = await rateLimitWrite(userId);
        if (!rateLimitResult.success) {
            throw new Error(`Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`);
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    onboarding_completed: false,
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating profile:', error);
                return null;
            }

            // Cache the new profile
            const profile = data as UserProfile;
            await this.cacheProfile(userId, profile);

            return profile;
        } catch (error) {
            console.error('Error in createProfile:', error);
            return null;
        }
    }

    /**
     * Update the user's profile
     */
    async updateProfile(userId: string, updates: ProfileUpdateData): Promise<UserProfile | null> {
        // Rate limit write operations
        const rateLimitResult = await rateLimitWrite(userId);
        if (!rateLimitResult.success) {
            throw new Error(`Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`);
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                console.error('Error updating profile:', error);
                return null;
            }

            // Update cache with new data
            const profile = data as UserProfile;
            await this.cacheProfile(userId, profile);

            return profile;
        } catch (error) {
            console.error('Error in updateProfile:', error);
            return null;
        }
    }

    /**
     * Complete onboarding for the user
     */
    async completeOnboarding(userId: string): Promise<boolean> {
        // Rate limit write operations
        const rateLimitResult = await rateLimitWrite(userId);
        if (!rateLimitResult.success) {
            throw new Error(`Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`);
        }

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    onboarding_completed: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId);

            if (error) {
                console.error('Error completing onboarding:', error);
                return false;
            }

            // Invalidate cache to reflect the change
            await this.invalidateProfileCache(userId);

            return true;
        } catch (error) {
            console.error('Error in completeOnboarding:', error);
            return false;
        }
    }

    /**
     * Check if the user has completed onboarding
     * Uses cached profile data
     */
    async isOnboardingCompleted(userId: string): Promise<boolean> {
        const profile = await this.getProfile(userId);
        return profile?.onboarding_completed ?? false;
    }

    /**
     * Get or create profile for the user
     */
    async getOrCreateProfile(userId: string): Promise<UserProfile | null> {
        let profile = await this.getProfile(userId);

        if (!profile) {
            profile = await this.createProfile(userId);
        }

        return profile;
    }

    /**
     * Calculate recommended daily calories based on user info
     */
    calculateDailyCalories(
        gender: string,
        age: number,
        height_cm: number,
        weight_kg: number,
        activity_level: string,
        goal: string
    ): number {
        // Calculate BMR using Mifflin-St Jeor Equation
        let bmr: number;
        if (gender === 'male') {
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
        } else {
            bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
        }

        // Apply activity multiplier
        const activityMultipliers: Record<string, number> = {
            sedentary: 1.2,
            light: 1.375,
            moderate: 1.55,
            active: 1.725,
            very_active: 1.9,
        };

        let tdee = bmr * (activityMultipliers[activity_level] || 1.55);

        // Adjust for goal
        if (goal === 'weight_loss') {
            tdee -= 500; // 500 calorie deficit
        } else if (goal === 'weight_gain' || goal === 'muscle_build') {
            tdee += 500; // 500 calorie surplus
        }

        return Math.round(tdee);
    }

    /**
     * Calculate recommended daily protein based on user info
     */
    calculateDailyProtein(weight_kg: number, goal: string, activity_level: string): number {
        let proteinPerKg = 1.6; // Default moderate protein

        if (goal === 'weight_gain' || goal === 'muscle_build' || activity_level === 'active' || activity_level === 'very_active') {
            proteinPerKg = 2.0;
        } else if (goal === 'weight_loss') {
            proteinPerKg = 1.8; // Higher protein helps preserve muscle during weight loss
        }

        return Math.round(weight_kg * proteinPerKg);
    }

    /**
     * Cache the profile data
     */
    private async cacheProfile(userId: string, profile: UserProfile): Promise<void> {
        const cacheKey = cacheKeys.userProfile(userId);
        await cache.set(cacheKey, profile, {
            ttl: CACHE_TTL.namespaces.profile,
            tags: [tagKeys.userProfile(userId), tagKeys.user(userId)],
        });
    }

    /**
     * Invalidate profile cache
     */
    private async invalidateProfileCache(userId: string): Promise<void> {
        try {
            await cache.invalidateByTag(tagKeys.userProfile(userId));
        } catch (error) {
            console.error('Error invalidating profile cache:', error);
        }
    }

    /**
     * Manually refresh profile cache
     * Useful when you know data has changed externally
     */
    async refreshCache(userId: string): Promise<void> {
        await this.invalidateProfileCache(userId);
        await this.getProfile(userId);
    }
}

export default new ProfileService();
