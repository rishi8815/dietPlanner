import AIFoodRecommendation from '@/components/AIFoodRecommendation';
import CalendarModal from '../../components/ui/CalendarModal';
import { useMealPlan } from '@/components/MealPlanContext';
import { useTheme } from '@/components/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const MealsScreen = () => {
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [showCustomMealModal, setShowCustomMealModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [customMealData, setCustomMealData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  const { colors, isDark } = useTheme();
  const {
    meals,
    updateMeal,
    removeMeal,
    getTotalNutrition,
    addCustomMeal,
    clearAllMeals,
    personalInfo,
    isLoading: contextLoading
  } = useMealPlan();

  const totalNutrition = getTotalNutrition();

  const handleSelectFood = (food: any) => {
    if (selectedMealId) {
      updateMeal(selectedMealId, food);
    }
    setShowAIRecommendations(false);
    setSelectedMealId(null);
  };

  const handleRemoveMeal = (mealId: string) => {
    Alert.alert(
      'Remove Meal',
      'Are you sure you want to remove this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeMeal(mealId) },
      ]
    );
  };

  const handleClearAllMeals = () => {
    Alert.alert(
      'Clear All Meals',
      'Are you sure you want to clear all meals? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAllMeals },
      ]
    );
  };

  const handleAddCustomMeal = () => {
    if (!customMealData.name || !customMealData.calories) {
      Alert.alert('Error', 'Please enter at least a meal name and calories.');
      return;
    }

    const calories = parseInt(customMealData.calories) || 0;
    const protein = parseInt(customMealData.protein) || 0;
    const carbs = parseInt(customMealData.carbs) || 0;
    const fat = parseInt(customMealData.fat) || 0;

    if (selectedMealId) {
      addCustomMeal(selectedMealId, customMealData.name, calories, protein, carbs, fat);
      setShowCustomMealModal(false);
      setSelectedMealId(null);
      setCustomMealData({ name: '', calories: '', protein: '', carbs: '', fat: '' });
    }
  };

  const handleAIRecommendations = () => {
    // Simply open AI recommendations - backend will handle authentication
    setShowAIRecommendations(true);
  };

  const MealItem = ({ meal }: { meal: any }) => (
    <View style={[styles.mealItem, { backgroundColor: colors.surface }]}>
      <View style={styles.mealHeader}>
        <View style={styles.mealInfo}>
          <Text style={[styles.mealTitle, { color: colors.text }]}>{meal.title}</Text>
          <Text style={[styles.mealTime, { color: colors.textSecondary }]}>{meal.time}</Text>
        </View>
        <View style={styles.mealActions}>
          {meal.hasFood && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveMeal(meal.id)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.statusError} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setSelectedMealId(meal.id);
              setShowAIRecommendations(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {meal.food ? (
        <View style={[styles.foodInfo, { borderTopColor: colors.border }]}>
          <Text style={[styles.foodName, { color: colors.text }]}>{meal.food.name}</Text>
          <View style={styles.nutritionRow}>
            <Text style={[styles.nutritionText, { color: colors.textSecondary }]}>
              {meal.food.calories} kcal
            </Text>
            <Text style={[styles.nutritionText, { color: colors.textSecondary }]}>
              {meal.food.protein}g protein
            </Text>
            <Text style={[styles.nutritionText, { color: colors.textSecondary }]}>
              {meal.food.carbs}g carbs
            </Text>
            <Text style={[styles.nutritionText, { color: colors.textSecondary }]}>
              {meal.food.fat}g fat
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.emptyMeal, { borderTopColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No meal planned</Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Tap + to add a meal</Text>
        </View>
      )}
    </View>
  );

  const NutritionSummary = () => (
    <View style={[styles.nutritionSummary, { backgroundColor: colors.surface }]}>
      <Text style={[styles.summaryTitle, { color: colors.text }]}>Today's Nutrition</Text>
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

      {personalInfo && (
        <View style={[styles.targetInfo, { borderTopColor: colors.border }]}>
          <Text style={[styles.targetLabel, { color: colors.textSecondary }]}>Target: {personalInfo.targetCalories} kcal</Text>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min((totalNutrition.calories / parseInt(personalInfo.targetCalories)) * 100, 100)}%` }
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );

  const CustomMealModal = () => (
    <Modal
      visible={showCustomMealModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowCustomMealModal(false)}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowCustomMealModal(false)}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Add Custom Meal</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Meal Name</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={customMealData.name}
              onChangeText={(text) => setCustomMealData(prev => ({ ...prev, name: text }))}
              placeholder="Enter meal name"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Calories</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={customMealData.calories}
              onChangeText={(text) => setCustomMealData(prev => ({ ...prev, calories: text }))}
              placeholder="Enter calories"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.nutritionInputs}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Protein (g)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={customMealData.protein}
                onChangeText={(text) => setCustomMealData(prev => ({ ...prev, protein: text }))}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Carbs (g)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={customMealData.carbs}
                onChangeText={(text) => setCustomMealData(prev => ({ ...prev, carbs: text }))}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Fat (g)</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={customMealData.fat}
                onChangeText={(text) => setCustomMealData(prev => ({ ...prev, fat: text }))}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>

          <TouchableOpacity style={[styles.addCustomButton, { backgroundColor: colors.primary }]} onPress={handleAddCustomMeal}>
            <Text style={styles.addCustomButtonText}>Add Meal</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (contextLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your meals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Meals</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton} onPress={handleClearAllMeals}>
              <Ionicons name="trash-outline" size={20} color={colors.statusError} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={() => setShowCalendarModal(true)}>
              <Ionicons name="calendar-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Nutrition Summary */}
        <NutritionSummary />

        {/* Meals List */}
        <View style={styles.mealsContainer}>
          <View style={styles.mealsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {selectedDate === new Date().toISOString().split('T')[0]
                ? "Today's Meals"
                : new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + "'s Meals"
              }
            </Text>
            <TouchableOpacity onPress={() => setShowCalendarModal(true)}>
              <Text style={[styles.changeDateText, { color: colors.primary }]}>Change Date</Text>
            </TouchableOpacity>
          </View>
          {meals.map((meal) => (
            <MealItem key={meal.id} meal={meal} />
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
            onPress={handleAIRecommendations}
          >
            <Ionicons name="bulb" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>
              Get Meal Recommendations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primaryLight }]}
            onPress={() => {
              setSelectedMealId('breakfast'); // Default to breakfast
              setShowCustomMealModal(true);
            }}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Add Custom Meal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* AI Food Recommendation Modal */}
      <AIFoodRecommendation
        visible={showAIRecommendations}
        onClose={() => {
          setShowAIRecommendations(false);
          setSelectedMealId(null);
        }}
        onSelectFood={handleSelectFood}
        selectedMealType={selectedMealId || 'breakfast'}
      />

      {/* Custom Meal Modal */}
      <CustomMealModal />

      {/* Calendar Modal */}
      <CalendarModal
        visible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />
    </SafeAreaView>
  );
};

export default MealsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
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
    minWidth: '45%',
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
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  mealsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeDateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mealItem: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mealTime: {
    fontSize: 12,
    marginTop: 2,
  },
  mealActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    padding: 4,
  },
  removeButton: {
    padding: 4,
  },
  foodInfo: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nutritionText: {
    fontSize: 12,
  },
  emptyMeal: {
    borderTopWidth: 1,
    paddingTop: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
  },
  quickActions: {
    flexDirection: 'column',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionText: {
    flex: 1,
    textAlign: 'center',
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
  inputLabel: {
    fontSize: 16,
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
  nutritionInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  addCustomButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  addCustomButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});