/**
 * Skeleton Loading Components
 * 
 * Reusable skeleton loaders that provide visual feedback during loading states.
 * Uses shimmer animation for a premium feel.
 */

import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Animated,
    Easing,
    ViewStyle,
    Dimensions,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// Base Skeleton Component with Shimmer
// ============================================

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
}) => {
    const { colors } = useTheme();
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        animation.start();
        return () => animation.stop();
    }, [shimmerAnim]);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    return (
        <View
            style={[
                {
                    width: typeof width === 'number' ? width : width as any,
                    height,
                    borderRadius,
                    backgroundColor: colors.surface,
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        transform: [{ translateX }],
                        backgroundColor: colors.border,
                        opacity: 0.3,
                    },
                ]}
            />
        </View>
    );
};

// ============================================
// Skeleton Variants
// ============================================

export const SkeletonText: React.FC<{ width?: number | string; lines?: number }> = ({
    width = '100%',
    lines = 1,
}) => {
    return (
        <View style={styles.textContainer}>
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton
                    key={index}
                    width={index === lines - 1 && lines > 1 ? '70%' : width}
                    height={14}
                    borderRadius={4}
                    style={index > 0 ? styles.textLine : undefined}
                />
            ))}
        </View>
    );
};

export const SkeletonCircle: React.FC<{ size?: number }> = ({ size = 48 }) => {
    return <Skeleton width={size} height={size} borderRadius={size / 2} />;
};

export const SkeletonButton: React.FC<{ width?: number | string }> = ({
    width = '100%',
}) => {
    return <Skeleton width={width} height={44} borderRadius={12} />;
};

// ============================================
// Composite Skeleton Components
// ============================================

/**
 * Skeleton for a single meal item card
 */
export const MealItemSkeleton: React.FC = () => {
    const { colors } = useTheme();

    return (
        <View style={[styles.mealItem, { borderColor: colors.border }]}>
            <View style={styles.mealItemContent}>
                <Skeleton width="60%" height={16} borderRadius={4} />
                <View style={styles.mealNutrition}>
                    <Skeleton width={60} height={14} borderRadius={4} />
                    <Skeleton width={40} height={12} borderRadius={4} style={styles.nutritionGap} />
                    <Skeleton width={40} height={12} borderRadius={4} style={styles.nutritionGap} />
                    <Skeleton width={40} height={12} borderRadius={4} style={styles.nutritionGap} />
                </View>
            </View>
        </View>
    );
};

/**
 * Skeleton for a meal section (breakfast, lunch, etc.)
 */
export const MealSectionSkeleton: React.FC<{ itemCount?: number }> = ({ itemCount = 1 }) => {
    const { colors } = useTheme();

    return (
        <View style={[styles.mealSection, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                    <SkeletonCircle size={24} />
                    <Skeleton width={80} height={18} borderRadius={4} style={styles.sectionTitle} />
                    <Skeleton width={30} height={14} borderRadius={4} />
                </View>
                <SkeletonCircle size={28} />
            </View>
            <View style={styles.mealsList}>
                {Array.from({ length: itemCount }).map((_, index) => (
                    <MealItemSkeleton key={index} />
                ))}
            </View>
        </View>
    );
};

/**
 * Skeleton for nutrition summary card
 */
export const NutritionSummarySkeleton: React.FC = () => {
    const { colors } = useTheme();

    return (
        <View style={[styles.nutritionSummary, { backgroundColor: colors.surface }]}>
            <Skeleton width={150} height={20} borderRadius={4} style={styles.summaryTitle} />
            <View style={styles.summaryGrid}>
                {[1, 2, 3, 4].map((item) => (
                    <View key={item} style={styles.summaryItem}>
                        <Skeleton width={50} height={12} borderRadius={4} />
                        <Skeleton width={70} height={18} borderRadius={4} style={styles.summaryValue} />
                    </View>
                ))}
            </View>
        </View>
    );
};

/**
 * Full meals page skeleton
 */
export const MealsPageSkeleton: React.FC = () => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Skeleton width={120} height={28} borderRadius={8} />
                <View style={styles.headerActions}>
                    <SkeletonCircle size={32} />
                    <SkeletonCircle size={32} />
                </View>
            </View>

            {/* Date Display */}
            <View style={styles.dateDisplaySkeleton}>
                <Skeleton width="100%" height={48} borderRadius={12} />
            </View>

            {/* Nutrition Summary */}
            <NutritionSummarySkeleton />

            {/* Meal Sections */}
            <View style={styles.mealsContainer}>
                <MealSectionSkeleton itemCount={1} />
                <MealSectionSkeleton itemCount={2} />
                <MealSectionSkeleton itemCount={1} />
                <MealSectionSkeleton itemCount={0} />
            </View>
        </View>
    );
};

/**
 * Inline loading overlay for meal operations
 */
export const MealOperationOverlay: React.FC<{ visible: boolean; message?: string }> = ({
    visible,
    message = 'Saving...',
}) => {
    const { colors } = useTheme();
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: visible ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [visible, fadeAnim]);

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.overlay,
                {
                    backgroundColor: colors.background + 'CC',
                    opacity: fadeAnim,
                },
            ]}
        >
            <View style={[styles.overlayContent, { backgroundColor: colors.surface }]}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={80} height={14} borderRadius={4} style={styles.overlayText} />
            </View>
        </Animated.View>
    );
};

// ============================================
// Profile Page Skeleton
// ============================================

export const ProfileSkeleton: React.FC = () => {
    const { colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Profile Header */}
            <View style={[styles.profileHeader, { backgroundColor: colors.surface }]}>
                <SkeletonCircle size={80} />
                <Skeleton width={150} height={24} borderRadius={6} style={styles.profileName} />
                <Skeleton width={200} height={14} borderRadius={4} />
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                {[1, 2, 3, 4].map((item) => (
                    <View key={item} style={[styles.statCard, { backgroundColor: colors.surface }]}>
                        <Skeleton width={60} height={12} borderRadius={4} />
                        <Skeleton width={80} height={24} borderRadius={4} style={styles.statValue} />
                    </View>
                ))}
            </View>

            {/* Settings List */}
            <View style={[styles.settingsList, { backgroundColor: colors.surface }]}>
                {[1, 2, 3, 4, 5].map((item) => (
                    <View key={item} style={styles.settingsItem}>
                        <SkeletonCircle size={24} />
                        <Skeleton width="60%" height={16} borderRadius={4} style={styles.settingsText} />
                    </View>
                ))}
            </View>
        </View>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    textContainer: {
        gap: 6,
    },
    textLine: {
        marginTop: 6,
    },

    // Meal Item
    mealItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    mealItemContent: {
        gap: 8,
    },
    mealNutrition: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nutritionGap: {
        marginLeft: 12,
    },

    // Meal Section
    mealSection: {
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 16,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        marginLeft: 8,
        marginRight: 8,
    },
    mealsList: {},

    // Nutrition Summary
    nutritionSummary: {
        marginHorizontal: 20,
        marginBottom: 16,
        borderRadius: 16,
        padding: 16,
    },
    summaryTitle: {
        marginBottom: 16,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    summaryItem: {
        width: '45%',
        gap: 6,
    },
    summaryValue: {
        marginTop: 4,
    },

    // Full Page
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 12,
    },
    dateDisplaySkeleton: {
        marginHorizontal: 20,
        marginBottom: 16,
    },
    mealsContainer: {
        gap: 0,
    },

    // Overlay
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    overlayContent: {
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        gap: 12,
    },
    overlayText: {
        marginTop: 8,
    },

    // Profile
    profileHeader: {
        alignItems: 'center',
        padding: 24,
        marginBottom: 16,
    },
    profileName: {
        marginTop: 16,
        marginBottom: 8,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 16,
        marginBottom: 16,
    },
    statCard: {
        width: '45%',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    statValue: {
        marginTop: 4,
    },
    settingsList: {
        marginHorizontal: 20,
        borderRadius: 12,
        padding: 8,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    settingsText: {
        marginLeft: 12,
    },
});

export default {
    Skeleton,
    SkeletonText,
    SkeletonCircle,
    SkeletonButton,
    MealItemSkeleton,
    MealSectionSkeleton,
    NutritionSummarySkeleton,
    MealsPageSkeleton,
    MealOperationOverlay,
    ProfileSkeleton,
};
