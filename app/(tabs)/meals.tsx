import AIFoodRecommendation, { FoodItem } from '@/components/AIFoodRecommendation';
import CalendarModal from '../../components/ui/CalendarModal';
import { BottomSheetModal } from '@/components/ui/BottomSheetModal';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import DailyMealsService, { MealItem } from '@/services/DailyMealsService';
import { showToast } from '@/components/ToastConfig';
import { MealsPageSkeleton } from '@/components/skeletons';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';

// Meal type configuration
const MEAL_TYPES = [
  { id: 'breakfast', title: 'Breakfast', time: '08:00', icon: 'sunny-outline' },
  { id: 'lunch', title: 'Lunch', time: '12:30', icon: 'restaurant-outline' },
  { id: 'dinner', title: 'Dinner', time: '19:00', icon: 'moon-outline' },
  { id: 'snacks', title: 'Snacks', time: '15:00', icon: 'cafe-outline' },
] as const;

const MAX_MEALS_PER_SECTION = 2;

const MealsScreen = () => {
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [showCustomMealModal, setShowCustomMealModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showMealActionSheet, setShowMealActionSheet] = useState(false);
  const [selectedMealForAction, setSelectedMealForAction] = useState<MealItem | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMealType, setSelectedMealType] = useState<string>('breakfast');
  const [modalMealType, setModalMealType] = useState<string>('breakfast'); // For modal form
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [customMealData, setCustomMealData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  const { colors } = useTheme();
  const { user } = useAuth();

  // Load meals for selected date
  const loadMeals = useCallback(async () => {
    if (!user?.id) return;

    try {
      const dailyMeals = await DailyMealsService.getMealsForDate(user.id, selectedDate);
      setMeals(dailyMeals?.meals || []);
      setIsLocked(dailyMeals?.is_locked || false);
    } catch (error) {
      console.error('Error loading meals:', error);
      showToast.error('Error', 'Failed to load meals');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, selectedDate]);

  useEffect(() => {
    setIsLoading(true);
    loadMeals();
  }, [loadMeals]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadMeals();
  }, [loadMeals]);

  // Get total nutrition
  const totalNutrition = DailyMealsService.calculateTotalNutrition(meals);

  // Get meals grouped by type
  const getMealsByType = (type: string) => {
    return meals.filter(meal => meal.meal_type === type);
  };

  // Check if section is full (max 2 meals)
  const isSectionFull = (mealType: string) => {
    return getMealsByType(mealType).length >= MAX_MEALS_PER_SECTION;
  };

  // Handle adding a recommended meal - OPTIMISTIC UPDATE
  const handleSelectFood = async (food: FoodItem) => {
    if (!user?.id) return;

    // Check if section is full
    if (isSectionFull(food.meal_type)) {
      showToast.error('Section Full', `Maximum ${MAX_MEALS_PER_SECTION} meals allowed per section`);
      setShowAIRecommendations(false);
      return;
    }

    const newMeal: Omit<MealItem, 'id' | 'added_at'> = {
      meal_type: food.meal_type,
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      time: food.time,
    };

    // Close modal immediately for better UX
    setShowAIRecommendations(false);
    showToast.success('Meal Added', `${food.name} added to your ${food.meal_type}`);

    // Use optimistic update - UI updates instantly
    await DailyMealsService.addMealOptimistic(
      user.id,
      selectedDate,
      newMeal,
      meals,
      (optimisticMeals) => setMeals(optimisticMeals),
      (error, originalMeals) => {
        setMeals(originalMeals);
        showToast.error('Error', 'Failed to add meal. Rolled back.');
      }
    );
  };

  // Handle meal actions (edit/delete) - opens bottom sheet
  const handleMealAction = (meal: MealItem) => {
    if (isLocked) {
      showToast.error('Locked', 'Past meals cannot be modified');
      return;
    }

    setSelectedMealForAction(meal);
    setShowMealActionSheet(true);
  };

  // Close meal action sheet
  const closeMealActionSheet = () => {
    setShowMealActionSheet(false);
    setSelectedMealForAction(null);
  };

  // Handle edit meal
  const handleEditMeal = () => {
    if (!selectedMealForAction) return;
    closeMealActionSheet();
    setEditingMeal(selectedMealForAction);
    setIsEditMode(true);
    setModalMealType(selectedMealForAction.meal_type);
    setCustomMealData({
      name: selectedMealForAction.name,
      calories: selectedMealForAction.calories.toString(),
      protein: selectedMealForAction.protein.toString(),
      carbs: selectedMealForAction.carbs.toString(),
      fat: selectedMealForAction.fat.toString(),
    });
    setShowCustomMealModal(true);
  };

  // Handle delete meal - OPTIMISTIC UPDATE
  const handleDeleteMeal = async () => {
    if (!user?.id || !selectedMealForAction) return;
    const mealToDelete = selectedMealForAction;
    closeMealActionSheet();

    // Show success immediately
    showToast.success('Deleted', 'Meal deleted successfully');

    // Use optimistic update
    await DailyMealsService.removeMealOptimistic(
      user.id,
      selectedDate,
      mealToDelete.id,
      meals,
      (optimisticMeals) => setMeals(optimisticMeals),
      (error, originalMeals) => {
        setMeals(originalMeals);
        showToast.error('Error', 'Failed to delete meal. Rolled back.');
      }
    );
  };

  // Handle clearing all meals for the day - OPTIMISTIC UPDATE
  const handleClearAllMeals = async () => {
    if (isLocked) {
      showToast.error('Locked', 'Past meals cannot be modified');
      return;
    }

    if (meals.length === 0) {
      showToast.info('No Meals', 'No meals to clear');
      return;
    }

    if (!user?.id) return;

    // Show success immediately
    showToast.success('Cleared', 'All meals cleared');

    // Use optimistic update
    await DailyMealsService.clearMealsOptimistic(
      user.id,
      selectedDate,
      meals,
      (optimisticMeals) => setMeals(optimisticMeals),
      (error, originalMeals) => {
        setMeals(originalMeals);
        showToast.error('Error', 'Failed to clear meals. Rolled back.');
      }
    );
  };

  // Handle adding/updating custom meal - OPTIMISTIC UPDATE
  const handleSaveCustomMeal = async () => {
    // Clear previous errors
    const newErrors = { name: '', calories: '', protein: '', carbs: '', fat: '' };
    let hasError = false;

    // Validate all required fields
    const trimmedName = customMealData.name.trim();
    const calories = parseInt(customMealData.calories);
    const protein = parseInt(customMealData.protein);
    const carbs = parseInt(customMealData.carbs);
    const fat = parseInt(customMealData.fat);

    if (!trimmedName) {
      newErrors.name = 'Please enter a meal name';
      hasError = true;
    }
    if (!customMealData.calories || isNaN(calories) || calories <= 0) {
      newErrors.calories = 'Please enter valid calories';
      hasError = true;
    }
    if (!customMealData.protein || isNaN(protein) || protein < 0) {
      newErrors.protein = 'Please enter valid protein';
      hasError = true;
    }
    if (!customMealData.carbs || isNaN(carbs) || carbs < 0) {
      newErrors.carbs = 'Please enter valid carbs';
      hasError = true;
    }
    if (!customMealData.fat || isNaN(fat) || fat < 0) {
      newErrors.fat = 'Please enter valid fat';
      hasError = true;
    }

    setFormErrors(newErrors);

    if (hasError) {
      return;
    }

    if (!user?.id) return;

    // Check section limit for new meals
    if (!isEditMode && isSectionFull(modalMealType)) {
      showToast.error('Section Full', `Maximum ${MAX_MEALS_PER_SECTION} meals allowed per section`);
      return;
    }

    const mealType = MEAL_TYPES.find(t => t.id === modalMealType);

    // Close modal immediately for better UX
    setShowCustomMealModal(false);
    setCustomMealData({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    const currentEditingMeal = editingMeal;
    const wasEditMode = isEditMode;
    setEditingMeal(null);
    setIsEditMode(false);

    if (wasEditMode && currentEditingMeal) {
      // Update existing meal - OPTIMISTIC
      const updates: Partial<MealItem> = {
        name: trimmedName,
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat,
      };

      showToast.success('Updated', `${trimmedName} updated successfully`);

      await DailyMealsService.updateMealOptimistic(
        user.id,
        selectedDate,
        currentEditingMeal.id,
        updates,
        meals,
        (optimisticMeals) => setMeals(optimisticMeals),
        (error, originalMeals) => {
          setMeals(originalMeals);
          showToast.error('Error', 'Failed to update meal. Rolled back.');
        }
      );
    } else {
      // Add new meal - OPTIMISTIC
      const newMeal: Omit<MealItem, 'id' | 'added_at'> = {
        meal_type: modalMealType as MealItem['meal_type'],
        name: trimmedName,
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat,
        time: mealType?.time || '12:00',
      };

      showToast.success('Meal Added', `${trimmedName} added successfully`);

      await DailyMealsService.addMealOptimistic(
        user.id,
        selectedDate,
        newMeal,
        meals,
        (optimisticMeals) => setMeals(optimisticMeals),
        (error, originalMeals) => {
          setMeals(originalMeals);
          showToast.error('Error', 'Failed to add meal. Rolled back.');
        }
      );
    }
  };

  // Close custom meal modal
  const closeCustomMealModal = () => {
    setShowCustomMealModal(false);
    setCustomMealData({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setFormErrors({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    setEditingMeal(null);
    setIsEditMode(false);
    setModalMealType('breakfast');
  };

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowCalendarModal(false);
  };

  // Check if date is today or future
  const isEditableDate = () => {
    const today = new Date().toISOString().split('T')[0];
    return selectedDate >= today && !isLocked;
  };

  // Meal section component
  const MealSection = ({ type }: { type: typeof MEAL_TYPES[number] }) => {
    const typeMeals = getMealsByType(type.id);
    const sectionFull = typeMeals.length >= MAX_MEALS_PER_SECTION;

    return (
      <View style={[styles.mealSection, { backgroundColor: colors.surface }]}>
        <View style={styles.mealSectionHeader}>
          <View style={styles.mealTypeInfo}>
            <Ionicons name={type.icon as any} size={20} color={colors.primary} />
            <Text style={[styles.mealTypeTitle, { color: colors.text }]}>{type.title}</Text>
            <Text style={[styles.mealTypeTime, { color: colors.textSecondary }]}>
              {typeMeals.length}/{MAX_MEALS_PER_SECTION}
            </Text>
          </View>
          {isEditableDate() && !sectionFull && (
            <TouchableOpacity
              style={styles.addMealButton}
              onPress={() => {
                setSelectedMealType(type.id);
                setShowAIRecommendations(true);
              }}
            >
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </TouchableOpacity>
          )}
          {sectionFull && (
            <View style={[styles.fullBadge, { backgroundColor: colors.statusSuccess + '20' }]}>
              <Text style={[styles.fullBadgeText, { color: colors.statusSuccess }]}>Full</Text>
            </View>
          )}
        </View>

        {typeMeals.length > 0 ? (
          <View style={styles.mealsList}>
            {typeMeals.map((meal) => (
              <View key={meal.id} style={[styles.mealItem, { borderColor: colors.border }]}>
                <View style={styles.mealItemContent}>
                  <Text style={[styles.mealName, { color: colors.text }]}>{meal.name}</Text>
                  <View style={styles.mealNutrition}>
                    <Text style={[styles.nutritionBadge, { color: colors.primary }]}>
                      {meal.calories} kcal
                    </Text>
                    <Text style={[styles.nutritionText, { color: colors.textSecondary }]}>
                      P: {meal.protein}g
                    </Text>
                    <Text style={[styles.nutritionText, { color: colors.textSecondary }]}>
                      C: {meal.carbs}g
                    </Text>
                    <Text style={[styles.nutritionText, { color: colors.textSecondary }]}>
                      F: {meal.fat}g
                    </Text>
                  </View>
                </View>
                {isEditableDate() && (
                  <TouchableOpacity
                    style={styles.mealActionButton}
                    onPress={() => handleMealAction(meal)}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyMealSection}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No {type.title.toLowerCase()} logged
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Nutrition Summary
  const NutritionSummary = () => (
    <View style={[styles.nutritionSummary, { backgroundColor: colors.surface }]}>
      <Text style={[styles.summaryTitle, { color: colors.text }]}>
        {DailyMealsService.formatDateForDisplay(selectedDate)}'s Nutrition
      </Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Calories</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{totalNutrition.calories} kcal</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Protein</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{totalNutrition.protein}g</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Carbs</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{totalNutrition.carbs}g</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Fat</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{totalNutrition.fat}g</Text>
        </View>
      </View>
    </View>
  );

  // Custom Meal Modal JSX - stored as variable to be rendered inline
  const customMealModalJSX = (
    <Modal
      visible={showCustomMealModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeCustomMealModal}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={closeCustomMealModal}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {isEditMode ? 'Edit Meal' : 'Add Custom Meal'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Meal Type Selector - Only show when adding new meal */}
          {!isEditMode && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Meal Type</Text>
              <View style={styles.mealTypeSelector}>
                {MEAL_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.mealTypeOption,
                      {
                        backgroundColor: modalMealType === type.id ? colors.primary : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setModalMealType(type.id)}
                  >
                    <Text
                      style={[
                        styles.mealTypeOptionText,
                        { color: modalMealType === type.id ? '#fff' : colors.text },
                      ]}
                    >
                      {type.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Meal Name *</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.surface, color: colors.text },
                formErrors.name ? { borderColor: colors.statusError, borderWidth: 1 } : { borderColor: colors.border }
              ]}
              value={customMealData.name}
              onChangeText={(text) => {
                setCustomMealData(prev => ({ ...prev, name: text }));
                if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="Enter meal name"
              placeholderTextColor={colors.textMuted}
            />
            {formErrors.name ? (
              <Text style={[styles.errorText, { color: colors.statusError }]}>{formErrors.name}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Calories *</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.surface, color: colors.text },
                formErrors.calories ? { borderColor: colors.statusError, borderWidth: 1 } : { borderColor: colors.border }
              ]}
              value={customMealData.calories}
              onChangeText={(text) => {
                setCustomMealData(prev => ({ ...prev, calories: text }));
                if (formErrors.calories) setFormErrors(prev => ({ ...prev, calories: '' }));
              }}
              placeholder="Enter calories"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
            {formErrors.calories ? (
              <Text style={[styles.errorText, { color: colors.statusError }]}>{formErrors.calories}</Text>
            ) : null}
          </View>

          <View style={styles.nutritionInputs}>
            <View style={styles.inputGroupSmall}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Protein (g) *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surface, color: colors.text },
                  formErrors.protein ? { borderColor: colors.statusError, borderWidth: 1 } : { borderColor: colors.border }
                ]}
                value={customMealData.protein}
                onChangeText={(text) => {
                  setCustomMealData(prev => ({ ...prev, protein: text }));
                  if (formErrors.protein) setFormErrors(prev => ({ ...prev, protein: '' }));
                }}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
              {formErrors.protein ? (
                <Text style={[styles.errorText, { color: colors.statusError }]}>{formErrors.protein}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroupSmall}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Carbs (g) *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surface, color: colors.text },
                  formErrors.carbs ? { borderColor: colors.statusError, borderWidth: 1 } : { borderColor: colors.border }
                ]}
                value={customMealData.carbs}
                onChangeText={(text) => {
                  setCustomMealData(prev => ({ ...prev, carbs: text }));
                  if (formErrors.carbs) setFormErrors(prev => ({ ...prev, carbs: '' }));
                }}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
              {formErrors.carbs ? (
                <Text style={[styles.errorText, { color: colors.statusError }]}>{formErrors.carbs}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroupSmall}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Fat (g) *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surface, color: colors.text },
                  formErrors.fat ? { borderColor: colors.statusError, borderWidth: 1 } : { borderColor: colors.border }
                ]}
                value={customMealData.fat}
                onChangeText={(text) => {
                  setCustomMealData(prev => ({ ...prev, fat: text }));
                  if (formErrors.fat) setFormErrors(prev => ({ ...prev, fat: '' }));
                }}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
              {formErrors.fat ? (
                <Text style={[styles.errorText, { color: colors.statusError }]}>{formErrors.fat}</Text>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addCustomButton, { backgroundColor: colors.primary }]}
            onPress={handleSaveCustomMeal}
          >
            <Text style={styles.addCustomButtonText}>{isEditMode ? 'Update Meal' : 'Add Meal'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  // Show skeleton loader instead of spinner
  if (isLoading) {
    return <MealsPageSkeleton />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Meals</Text>
          <View style={styles.headerActions}>
            {meals.length > 0 && isEditableDate() && (
              <TouchableOpacity style={styles.headerButton} onPress={handleClearAllMeals}>
                <Ionicons name="trash-outline" size={20} color={colors.statusError} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerButton} onPress={() => setShowCalendarModal(true)}>
              <Ionicons name="calendar-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Display */}
        <TouchableOpacity
          style={[styles.dateDisplay, { backgroundColor: colors.surface }]}
          onPress={() => setShowCalendarModal(true)}
        >
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.text }]}>
            {DailyMealsService.formatDateForDisplay(selectedDate)}
          </Text>
          {isLocked && (
            <View style={[styles.lockedBadge, { backgroundColor: colors.statusWarning + '20' }]}>
              <Ionicons name="lock-closed" size={14} color={colors.statusWarning} />
              <Text style={[styles.lockedText, { color: colors.statusWarning }]}>Locked</Text>
            </View>
          )}
          <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Nutrition Summary */}
        <NutritionSummary />

        {/* Meal Sections */}
        <View style={styles.mealsContainer}>
          {MEAL_TYPES.map((type) => (
            <MealSection key={type.id} type={type} />
          ))}
        </View>

        {/* Quick Actions */}
        {isEditableDate() && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
              onPress={() => {
                setSelectedMealType('breakfast');
                setShowAIRecommendations(true);
              }}
            >
              <Ionicons name="bulb" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>
                Get Meal Recommendations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
              onPress={() => {
                setModalMealType('breakfast');
                setShowCustomMealModal(true);
              }}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Add Custom Meal</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* AI Food Recommendation Modal */}
      <AIFoodRecommendation
        visible={showAIRecommendations}
        onClose={() => setShowAIRecommendations(false)}
        onSelectFood={handleSelectFood}
        selectedMealType={selectedMealType}
      />

      {/* Custom Meal Modal */}
      {customMealModalJSX}

      {/* Calendar Modal */}
      <CalendarModal
        visible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />

      {/* Meal Action Bottom Sheet */}
      <BottomSheetModal
        visible={showMealActionSheet}
        onClose={closeMealActionSheet}
        title={selectedMealForAction?.name || 'Meal Options'}
        maxHeight={300}
      >
        <View style={styles.actionSheetContent}>

          <TouchableOpacity
            style={[styles.actionSheetButton, { backgroundColor: colors.primaryLight }]}
            onPress={handleEditMeal}
          >
            <Ionicons name="create-outline" size={22} color={colors.primary} />
            <Text style={[styles.actionSheetButtonText, { color: colors.primary }]}>Edit Meal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionSheetButton, { backgroundColor: colors.statusError + '15' }]}
            onPress={handleDeleteMeal}
          >
            <Ionicons name="trash-outline" size={22} color={colors.statusError} />
            <Text style={[styles.actionSheetButtonText, { color: colors.statusError }]}>Delete Meal</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetModal>
    </View>
  );
};

export default MealsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  nutritionSummary: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    minWidth: '40%',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  targetInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  targetLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  mealsContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  mealSection: {
    borderRadius: 16,
    padding: 16,
  },
  mealSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTypeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mealTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  mealTypeTime: {
    fontSize: 12,
  },
  addMealButton: {
    padding: 4,
  },
  fullBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fullBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mealsList: {
    gap: 8,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
  },
  mealItemContent: {
    flex: 1,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  mealNutrition: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nutritionBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  nutritionText: {
    fontSize: 11,
  },
  removeMealButton: {
    padding: 8,
  },
  mealActionButton: {
    padding: 8,
  },
  emptyMealSection: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  quickActions: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputGroupSmall: {
    flex: 1,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  mealTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealTypeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  mealTypeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  nutritionInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  addCustomButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  addCustomButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Action Sheet Styles
  actionSheetContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
  },
  actionSheetSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  actionSheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 10,
  },
  actionSheetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionSheetCancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  actionSheetCancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
});