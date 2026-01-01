import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "./../context/ThemeContext"
import { useMealPlan } from "./MealPlanContext";

// Updated to match database schema for direct saving
export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  time: string; // "08:00", "12:30", etc.
}

interface AIFoodRecommendationProps {
  visible: boolean;
  onClose: () => void;
  onSelectFood: (food: FoodItem) => void;
  selectedMealType?: string;
}

const AIFoodRecommendation: React.FC<AIFoodRecommendationProps> = ({
  visible,
  onClose,
  onSelectFood,
  selectedMealType = "breakfast",
}) => {
  const [recommendations, setRecommendations] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { personalInfo } = useMealPlan();
  const { colors } = useTheme();

  useEffect(() => {
    if (visible) {
      loadRecommendations();
    }
  }, [visible, selectedMealType]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    // Simulate API call delay - will be replaced with actual backend call
    await new Promise(resolve => setTimeout(resolve, 500));
    const recs = getRecommendations(selectedMealType);
    setRecommendations(recs);
    setIsLoading(false);
  };

  // Recommendations data - will come from backend API later
  // Data format matches database schema for direct saving
  const getRecommendations = (mealType: string): FoodItem[] => {
    const meals: Record<string, FoodItem[]> = {
      breakfast: [
        {
          id: `breakfast_${Date.now()}_1`,
          name: "Oatmeal with Berries and Almonds",
          calories: 280,
          protein: 8,
          carbs: 45,
          fat: 6,
          meal_type: "breakfast",
          time: "08:00",
        },
        {
          id: `breakfast_${Date.now()}_2`,
          name: "Greek Yogurt with Honey and Granola",
          calories: 200,
          protein: 15,
          carbs: 20,
          fat: 8,
          meal_type: "breakfast",
          time: "08:00",
        },
        {
          id: `breakfast_${Date.now()}_3`,
          name: "Whole Grain Toast with Avocado and Eggs",
          calories: 320,
          protein: 10,
          carbs: 35,
          fat: 18,
          meal_type: "breakfast",
          time: "08:00",
        },
        {
          id: `breakfast_${Date.now()}_4`,
          name: "Smoothie Bowl with Banana and Berries",
          calories: 250,
          protein: 12,
          carbs: 30,
          fat: 8,
          meal_type: "breakfast",
          time: "08:00",
        },
        {
          id: `breakfast_${Date.now()}_5`,
          name: "Scrambled Eggs with Spinach and Toast",
          calories: 220,
          protein: 18,
          carbs: 5,
          fat: 12,
          meal_type: "breakfast",
          time: "08:00",
        },
      ],
      lunch: [
        {
          id: `lunch_${Date.now()}_1`,
          name: "Grilled Chicken Salad with Mixed Greens",
          calories: 350,
          protein: 25,
          carbs: 15,
          fat: 18,
          meal_type: "lunch",
          time: "12:30",
        },
        {
          id: `lunch_${Date.now()}_2`,
          name: "Quinoa Bowl with Roasted Vegetables",
          calories: 380,
          protein: 12,
          carbs: 45,
          fat: 14,
          meal_type: "lunch",
          time: "12:30",
        },
        {
          id: `lunch_${Date.now()}_3`,
          name: "Turkey Sandwich on Whole Grain Bread",
          calories: 320,
          protein: 20,
          carbs: 35,
          fat: 12,
          meal_type: "lunch",
          time: "12:30",
        },
        {
          id: `lunch_${Date.now()}_4`,
          name: "Vegetable Soup with Grilled Cheese",
          calories: 200,
          protein: 8,
          carbs: 25,
          fat: 8,
          meal_type: "lunch",
          time: "12:30",
        },
        {
          id: `lunch_${Date.now()}_5`,
          name: "Tuna Salad with Crackers",
          calories: 280,
          protein: 22,
          carbs: 10,
          fat: 16,
          meal_type: "lunch",
          time: "12:30",
        },
      ],
      dinner: [
        {
          id: `dinner_${Date.now()}_1`,
          name: "Salmon with Roasted Vegetables",
          calories: 420,
          protein: 28,
          carbs: 20,
          fat: 22,
          meal_type: "dinner",
          time: "19:00",
        },
        {
          id: `dinner_${Date.now()}_2`,
          name: "Lean Beef Stir Fry with Brown Rice",
          calories: 380,
          protein: 25,
          carbs: 25,
          fat: 18,
          meal_type: "dinner",
          time: "19:00",
        },
        {
          id: `dinner_${Date.now()}_3`,
          name: "Vegetarian Pasta with Marinara Sauce",
          calories: 350,
          protein: 12,
          carbs: 45,
          fat: 12,
          meal_type: "dinner",
          time: "19:00",
        },
        {
          id: `dinner_${Date.now()}_4`,
          name: "Chicken Breast with Quinoa and Broccoli",
          calories: 400,
          protein: 30,
          carbs: 35,
          fat: 14,
          meal_type: "dinner",
          time: "19:00",
        },
        {
          id: `dinner_${Date.now()}_5`,
          name: "Tofu Curry with Basmati Rice",
          calories: 320,
          protein: 15,
          carbs: 30,
          fat: 16,
          meal_type: "dinner",
          time: "19:00",
        },
      ],
      snacks: [
        {
          id: `snacks_${Date.now()}_1`,
          name: "Apple Slices with Almond Butter",
          calories: 180,
          protein: 4,
          carbs: 20,
          fat: 10,
          meal_type: "snacks",
          time: "15:00",
        },
        {
          id: `snacks_${Date.now()}_2`,
          name: "Hummus with Carrot and Celery Sticks",
          calories: 150,
          protein: 6,
          carbs: 18,
          fat: 8,
          meal_type: "snacks",
          time: "15:00",
        },
        {
          id: `snacks_${Date.now()}_3`,
          name: "Greek Yogurt with Mixed Berries",
          calories: 120,
          protein: 12,
          carbs: 8,
          fat: 4,
          meal_type: "snacks",
          time: "15:00",
        },
        {
          id: `snacks_${Date.now()}_4`,
          name: "Mixed Nuts and Dried Cranberries",
          calories: 200,
          protein: 6,
          carbs: 8,
          fat: 18,
          meal_type: "snacks",
          time: "15:00",
        },
        {
          id: `snacks_${Date.now()}_5`,
          name: "Banana with Peanut Butter",
          calories: 220,
          protein: 6,
          carbs: 25,
          fat: 12,
          meal_type: "snacks",
          time: "15:00",
        },
      ],
    };

    return meals[mealType as keyof typeof meals] || meals.breakfast;
  };

  const handleSelectFood = (food: FoodItem) => {
    onSelectFood(food);
    onClose();
  };

  const FoodCard = ({ food }: { food: FoodItem }) => (
    <TouchableOpacity
      style={[styles.foodCard, { backgroundColor: colors.surface }]}
      onPress={() => handleSelectFood(food)}
    >
      <View style={styles.foodHeader}>
        <Text style={[styles.foodName, { color: colors.text }]}>{food.name}</Text>
        <Text style={[styles.foodCalories, { color: colors.primary }]}>{food.calories} kcal</Text>
      </View>

      <View style={styles.nutritionInfo}>
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>Protein</Text>
          <Text style={[styles.nutritionValue, { color: colors.text }]}>{food.protein}g</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>Carbs</Text>
          <Text style={[styles.nutritionValue, { color: colors.text }]}>{food.carbs}g</Text>
        </View>
        <View style={styles.nutritionItem}>
          <Text style={[styles.nutritionLabel, { color: colors.textSecondary }]}>Fat</Text>
          <Text style={[styles.nutritionValue, { color: colors.text }]}>{food.fat}g</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading recommendations...
          </Text>
        </View>
      );
    }

    if (recommendations.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="restaurant-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Recommendations</Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            Unable to load recommendations. Please try again.
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadRecommendations}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.recommendationsContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)} Recommendations
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Tap a meal to add it to your plan
          </Text>
        </View>

        <View style={styles.recommendationsList}>
          {recommendations.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.regenerateButton, { backgroundColor: colors.primaryLight }]}
          onPress={loadRecommendations}
        >
          <Ionicons name="refresh" size={20} color={colors.primary} />
          <Text style={[styles.regenerateButtonText, { color: colors.primary }]}>
            Refresh Recommendations
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Meal Recommendations</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Content */}
        {renderContent()}
      </SafeAreaView>
    </Modal>
  );
};

export default AIFoodRecommendation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  recommendationsContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  recommendationsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  foodCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  foodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: "600",
  },
  nutritionInfo: {
    flexDirection: "row",
    gap: 16,
  },
  nutritionItem: {
    flex: 1,
  },
  nutritionLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  regenerateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 12,
    gap: 8,
  },
  regenerateButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
