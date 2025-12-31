import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useProfile } from '@/context/ProfileContext';
import { showToast } from '@/components/ToastConfig';
import ProfileService from '@/services/ProfileService';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');

interface OnboardingData {
    name: string;
    gender: string;
    age: string;
    height_cm: string;
    weight_kg: string;
    goal: string;
    activity_level: string;
    diet_type: string;
    allergies: string[];
    disliked_foods: string;
}

const STEPS = [
    { id: 1, title: 'Basic Info', icon: 'person' },
    { id: 2, title: 'Body Stats', icon: 'body' },
    { id: 3, title: 'Goals', icon: 'trophy' },
    { id: 4, title: 'Diet', icon: 'nutrition' },
];

const GENDER_OPTIONS = [
    { id: 'male', label: 'Male', icon: 'male' },
    { id: 'female', label: 'Female', icon: 'female' },
    { id: 'other', label: 'Other', icon: 'person' },
];

const GOAL_OPTIONS = [
    { id: 'weight_loss', label: 'Lose Weight', icon: 'trending-down', desc: 'Burn fat and get lean' },
    { id: 'maintenance', label: 'Maintain', icon: 'remove', desc: 'Keep current weight' },
    { id: 'weight_gain', label: 'Gain Weight', icon: 'trending-up', desc: 'Increase body weight' },
    { id: 'muscle_build', label: 'Build Muscle', icon: 'barbell', desc: 'Gain muscle mass' },
];

const ACTIVITY_OPTIONS = [
    { id: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
    { id: 'light', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
    { id: 'moderate', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
    { id: 'active', label: 'Active', desc: 'Hard exercise 6-7 days/week' },
    { id: 'very_active', label: 'Very Active', desc: 'Very hard exercise & physical job' },
];

const DIET_OPTIONS = [
    { id: 'non_veg', label: 'Non-Vegetarian', icon: 'restaurant' },
    { id: 'veg', label: 'Vegetarian', icon: 'leaf' },
    { id: 'eggitarian', label: 'Eggitarian', icon: 'egg' },
    { id: 'vegan', label: 'Vegan', icon: 'nutrition' },
];

const ALLERGY_OPTIONS = [
    'Gluten', 'Dairy', 'Eggs', 'Nuts', 'Peanuts', 'Soy', 'Fish', 'Shellfish', 'Sesame'
];

interface OnboardingScreenProps {
    onComplete: () => void;
    onSkip: () => void;
    isEditMode?: boolean;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete, onSkip, isEditMode = false }) => {
    const { colors, isDark } = useTheme();
    const { updateProfile, profile } = useProfile();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize data with existing profile data if in edit mode
    const [data, setData] = useState<OnboardingData>({
        name: profile?.name || '',
        gender: profile?.gender || '',
        age: profile?.age?.toString() || '',
        height_cm: profile?.height_cm?.toString() || '',
        weight_kg: profile?.weight_kg?.toString() || '',
        goal: profile?.goal || '',
        activity_level: profile?.activity_level || '',
        diet_type: profile?.diet_type || '',
        allergies: profile?.allergies || [],
        disliked_foods: profile?.disliked_foods?.join(', ') || '',
    });

    const updateData = (key: keyof OnboardingData, value: string | string[]) => {
        setData((prev) => ({ ...prev, [key]: value }));
    };

    const toggleAllergy = (allergy: string) => {
        setData((prev) => ({
            ...prev,
            allergies: prev.allergies.includes(allergy)
                ? prev.allergies.filter((a) => a !== allergy)
                : [...prev.allergies, allergy],
        }));
    };

    const canProceed = (): boolean => {
        switch (currentStep) {
            case 1:
                return data.name.trim().length >= 2 && data.gender !== '';
            case 2:
                return data.age !== '' && data.height_cm !== '' && data.weight_kg !== '';
            case 3:
                return data.goal !== '' && data.activity_level !== '';
            case 4:
                return data.diet_type !== '';
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        if (!user?.id) return;

        setIsSubmitting(true);

        // Calculate nutrition targets
        const dailyCalories = ProfileService.calculateDailyCalories(
            data.gender,
            parseInt(data.age),
            parseInt(data.height_cm),
            parseInt(data.weight_kg),
            data.activity_level,
            data.goal
        );

        const dailyProtein = ProfileService.calculateDailyProtein(
            parseInt(data.weight_kg),
            data.goal,
            data.activity_level
        );

        const profileData = {
            name: data.name.trim(),
            gender: data.gender,
            age: parseInt(data.age),
            height_cm: parseInt(data.height_cm),
            weight_kg: parseInt(data.weight_kg),
            goal: data.goal,
            activity_level: data.activity_level,
            diet_type: data.diet_type,
            allergies: data.allergies,
            disliked_foods: data.disliked_foods.split(',').map((f) => f.trim()).filter(Boolean),
            daily_calories_target: dailyCalories,
            daily_protein_target: dailyProtein,
            onboarding_completed: true,
        };

        const success = await updateProfile(profileData);

        setIsSubmitting(false);

        if (success) {
            showToast.success(
                isEditMode ? 'Profile Updated!' : 'Profile Complete!',
                isEditMode ? 'Your profile has been updated' : 'Your personalized plan is ready'
            );
            onComplete();
        } else {
            showToast.error('Error', 'Failed to save profile. Please try again.');
        }
    };

    const styles = createStyles(colors, isDark);

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                    <View style={styles.stepItem}>
                        <View style={[
                            styles.stepCircle,
                            currentStep >= step.id && { backgroundColor: colors.primary },
                            currentStep === step.id && styles.stepCircleActive,
                        ]}>
                            {currentStep > step.id ? (
                                <Ionicons name="checkmark" size={16} color="#fff" />
                            ) : (
                                <Text style={[
                                    styles.stepNumber,
                                    currentStep >= step.id && { color: '#fff' },
                                ]}>
                                    {step.id}
                                </Text>
                            )}
                        </View>
                        <Text style={[
                            styles.stepLabel,
                            currentStep === step.id && { color: colors.primary, fontWeight: '600' },
                        ]}>
                            {step.title}
                        </Text>
                    </View>
                    {index < STEPS.length - 1 && (
                        <View style={[
                            styles.stepLine,
                            currentStep > step.id && { backgroundColor: colors.primary },
                        ]} />
                    )}
                </React.Fragment>
            ))}
        </View>
    );

    const renderStep1 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Let's get to know you</Text>
            <Text style={styles.stepSubtitle}>Tell us about yourself to personalize your experience</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>What's your name?</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textMuted}
                    value={data.name}
                    onChangeText={(value) => updateData('name', value)}
                    autoCapitalize="words"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>What's your gender?</Text>
                <View style={styles.optionGrid}>
                    {GENDER_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.optionCard,
                                data.gender === option.id && styles.optionCardSelected,
                            ]}
                            onPress={() => updateData('gender', option.id)}
                        >
                            <Ionicons
                                name={option.icon as any}
                                size={28}
                                color={data.gender === option.id ? colors.primary : colors.textMuted}
                            />
                            <Text style={[
                                styles.optionLabel,
                                data.gender === option.id && styles.optionLabelSelected,
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Your body stats</Text>
            <Text style={styles.stepSubtitle}>This helps us calculate your nutrition needs</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Age</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your age"
                    placeholderTextColor={colors.textMuted}
                    value={data.age}
                    onChangeText={(value) => updateData('age', value.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    maxLength={3}
                />
            </View>

            <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Height (cm)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 170"
                        placeholderTextColor={colors.textMuted}
                        value={data.height_cm}
                        onChangeText={(value) => updateData('height_cm', value.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                        maxLength={3}
                    />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Weight (kg)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 70"
                        placeholderTextColor={colors.textMuted}
                        value={data.weight_kg}
                        onChangeText={(value) => updateData('weight_kg', value.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                        maxLength={3}
                    />
                </View>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What's your goal?</Text>
            <Text style={styles.stepSubtitle}>We'll create a meal plan that matches your goals</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Primary Goal</Text>
                {GOAL_OPTIONS.map((option) => (
                    <TouchableOpacity
                        key={option.id}
                        style={[
                            styles.goalCard,
                            data.goal === option.id && styles.goalCardSelected,
                        ]}
                        onPress={() => updateData('goal', option.id)}
                    >
                        <View style={[
                            styles.goalIcon,
                            data.goal === option.id && { backgroundColor: colors.primaryLight },
                        ]}>
                            <Ionicons
                                name={option.icon as any}
                                size={24}
                                color={data.goal === option.id ? colors.primary : colors.textMuted}
                            />
                        </View>
                        <View style={styles.goalContent}>
                            <Text style={[
                                styles.goalLabel,
                                data.goal === option.id && styles.goalLabelSelected,
                            ]}>
                                {option.label}
                            </Text>
                            <Text style={styles.goalDesc}>{option.desc}</Text>
                        </View>
                        {data.goal === option.id && (
                            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Activity Level</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {ACTIVITY_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.activityCard,
                                data.activity_level === option.id && styles.activityCardSelected,
                            ]}
                            onPress={() => updateData('activity_level', option.id)}
                        >
                            <Text style={[
                                styles.activityLabel,
                                data.activity_level === option.id && styles.activityLabelSelected,
                            ]}>
                                {option.label}
                            </Text>
                            <Text style={styles.activityDesc}>{option.desc}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );

    const renderStep4 = () => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Dietary preferences</Text>
            <Text style={styles.stepSubtitle}>Help us suggest meals that suit your lifestyle</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Diet Type</Text>
                <View style={styles.dietGrid}>
                    {DIET_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.dietCard,
                                data.diet_type === option.id && styles.dietCardSelected,
                            ]}
                            onPress={() => updateData('diet_type', option.id)}
                        >
                            <Ionicons
                                name={option.icon as any}
                                size={22}
                                color={data.diet_type === option.id ? colors.primary : colors.textMuted}
                            />
                            <Text style={[
                                styles.dietLabel,
                                data.diet_type === option.id && styles.dietLabelSelected,
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Any allergies?</Text>
                <View style={styles.allergyGrid}>
                    {ALLERGY_OPTIONS.map((allergy) => (
                        <TouchableOpacity
                            key={allergy}
                            style={[
                                styles.allergyChip,
                                data.allergies.includes(allergy) && styles.allergyChipSelected,
                            ]}
                            onPress={() => toggleAllergy(allergy)}
                        >
                            <Text style={[
                                styles.allergyText,
                                data.allergies.includes(allergy) && styles.allergyTextSelected,
                            ]}>
                                {allergy}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Disliked foods (optional)</Text>
                <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="e.g. mushrooms, olives, spinach"
                    placeholderTextColor={colors.textMuted}
                    value={data.disliked_foods}
                    onChangeText={(value) => updateData('disliked_foods', value)}
                    multiline
                />
            </View>
        </View>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            default: return null;
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
                        <Text style={styles.skipText}>{isEditMode ? 'Cancel' : 'Skip'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Step Indicator */}
                {renderStepIndicator()}

                {/* Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {renderCurrentStep()}
                </ScrollView>

                {/* Footer Buttons */}
                <View style={styles.footer}>
                    {currentStep > 1 && (
                        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                            <Ionicons name="arrow-back" size={20} color={colors.text} />
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[
                            styles.nextButton,
                            !canProceed() && styles.nextButtonDisabled,
                            currentStep === 1 && styles.nextButtonFull,
                        ]}
                        onPress={handleNext}
                        disabled={!canProceed() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.nextButtonText}>
                                    {currentStep === STEPS.length ? (isEditMode ? 'Update' : 'Complete') : 'Continue'}
                                </Text>
                                {currentStep < STEPS.length && (
                                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                                )}
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    skipButton: {
        padding: 8,
    },
    skipText: {
        fontSize: 16,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    stepItem: {
        alignItems: 'center',
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    stepCircleActive: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMuted,
    },
    stepLabel: {
        fontSize: 11,
        color: colors.textMuted,
    },
    stepLine: {
        width: 40,
        height: 2,
        backgroundColor: colors.border,
        marginBottom: 20,
        marginHorizontal: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        marginBottom: 32,
        lineHeight: 22,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 10,
    },
    input: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: colors.text,
    },
    multilineInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    rowInputs: {
        flexDirection: 'row',
    },
    optionGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    optionCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    optionCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    optionLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
    optionLabelSelected: {
        color: colors.primary,
    },
    goalCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 16,
        marginBottom: 10,
    },
    goalCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    goalIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.surfaceSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    goalContent: {
        flex: 1,
    },
    goalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    goalLabelSelected: {
        color: colors.primary,
    },
    goalDesc: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    activityCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        marginRight: 10,
        width: 140,
    },
    activityCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    activityLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    activityLabelSelected: {
        color: colors.primary,
    },
    activityDesc: {
        fontSize: 11,
        color: colors.textSecondary,
        lineHeight: 14,
    },
    dietGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    dietCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 10,
        paddingHorizontal: 14,
        gap: 8,
    },
    dietCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    dietLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
    dietLabelSelected: {
        color: colors.primary,
    },
    allergyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    allergyChip: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 8,
        paddingHorizontal: 14,
    },
    allergyChipSelected: {
        borderColor: colors.accent,
        backgroundColor: colors.accentLight,
    },
    allergyText: {
        fontSize: 13,
        color: colors.text,
    },
    allergyTextSelected: {
        color: colors.accent,
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: colors.surface,
        gap: 6,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    nextButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: colors.primary,
        gap: 6,
    },
    nextButtonFull: {
        flex: 1,
    },
    nextButtonDisabled: {
        opacity: 0.5,
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
