import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import ProfileService, { UserProfile, ProfileUpdateData } from '@/services/ProfileService';

interface ProfileContextType {
    profile: UserProfile | null;
    isLoading: boolean;
    isOnboardingComplete: boolean;
    refreshProfile: () => Promise<void>;
    updateProfile: (updates: ProfileUpdateData) => Promise<boolean>;
    completeOnboarding: () => Promise<boolean>;
    skipOnboarding: () => void;
    showOnboarding: boolean;
    setShowOnboarding: (show: boolean) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (!user?.id) {
            setProfile(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const userProfile = await ProfileService.getOrCreateProfile(user.id);
            setProfile(userProfile);

            // Show onboarding if not completed
            if (userProfile && !userProfile.onboarding_completed) {
                setShowOnboarding(true);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const refreshProfile = async () => {
        await fetchProfile();
    };

    const updateProfile = async (updates: ProfileUpdateData): Promise<boolean> => {
        if (!user?.id) return false;

        const updatedProfile = await ProfileService.updateProfile(user.id, updates);
        if (updatedProfile) {
            setProfile(updatedProfile);
            // Close onboarding screen after successful update
            if (updatedProfile.onboarding_completed) {
                setShowOnboarding(false);
            }
            return true;
        }
        return false;
    };

    const completeOnboarding = async (): Promise<boolean> => {
        if (!user?.id) return false;

        const success = await ProfileService.completeOnboarding(user.id);
        if (success) {
            setProfile((prev) => prev ? { ...prev, onboarding_completed: true } : null);
            setShowOnboarding(false);
        }
        return success;
    };

    const skipOnboarding = () => {
        // User can skip but will be prompted again when accessing certain features
        setShowOnboarding(false);
    };

    const isOnboardingComplete = profile?.onboarding_completed ?? false;

    const value: ProfileContextType = {
        profile,
        isLoading,
        isOnboardingComplete,
        refreshProfile,
        updateProfile,
        completeOnboarding,
        skipOnboarding,
        showOnboarding,
        setShowOnboarding,
    };

    return (
        <ProfileContext.Provider value={value}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfile = (): ProfileContextType => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
};
