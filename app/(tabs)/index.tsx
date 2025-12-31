import DateTimeDisplay from "@/components/DateTimeDisplay";
import { useMealPlan } from "../../components/MealPlanContext";
import { useTheme } from "../../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");





// Home Screen Component
const HomeScreen = ({ onNavigate }: { onNavigate?: (tab: string) => void }) => {
  const [selectedView, setSelectedView] = useState("Daily");
  const { meals, nutritionalData, getTotalNutrition, personalInfo } =
    useMealPlan();
  const totalNutrition = getTotalNutrition();
  const { colors, isDark } = useTheme();

  const MetricCard = ({
    icon,
    color,
    title,
    value,
    target,
  }: {
    icon: string;
    color: string;
    title: string;
    value: number;
    target: number;
  }) => {
    const percentage = target > 0 ? Math.min((value / target) * 100, 100) : 0;
    const isOverTarget = value > target;

    return (
      <View style={[styles.metricCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.metricIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={20} color="white" />
        </View>
        <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>{title}:</Text>
        <Text style={[styles.metricValue, { color: colors.text }]}>
          {value}/{target}
          {title === "Calorie" ? " kcal" : "g"}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
                backgroundColor: isOverTarget ? colors.statusError : colors.statusSuccess,
              },
            ]}
          />
        </View>
        <Text
          style={[
            styles.percentageText,
            { color: isOverTarget ? colors.statusError : colors.statusSuccess },
          ]}
        >
          {percentage.toFixed(0)}%
        </Text>
      </View>
    );
  };

  const MealCard = ({ meal }: { meal: any }) => (
    <View style={[styles.mealCard, { backgroundColor: colors.surface }]}>
      <View style={styles.mealHeader}>
        <View>
          <Text style={[styles.mealTitle, { color: colors.text }]}>{meal.title}</Text>
          <Text style={[styles.mealTime, { color: colors.textSecondary }]}>({meal.time})</Text>
        </View>
        {meal.hasFood ? (
          <Ionicons name="checkmark" size={20} color={colors.statusSuccess} />
        ) : (
          <Ionicons name="add" size={20} color={colors.textMuted} />
        )}
      </View>
      {meal.food && <Text style={[styles.mealFood, { color: colors.textSecondary }]}>{meal.food.name}</Text>}
    </View>
  );


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              <DateTimeDisplay />
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </View>
          <TouchableOpacity>
            <Ionicons name="person-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={[styles.greetingText, { color: colors.textMuted }]}>Greetings there,</Text>
          <Text style={[styles.questionText, { color: colors.text }]}>Are You Eating Healthy?</Text>
        </View>

        {/* Metrics */}
        <View style={styles.metricsContainer}>
          {personalInfo ? (
            <>
              <MetricCard
                icon="flame"
                color="#FFC107"
                title="Calorie"
                value={totalNutrition.calories}
                target={nutritionalData.calories}
              />
              <MetricCard
                icon="water"
                color="#2196F3"
                title="Protein"
                value={totalNutrition.protein}
                target={nutritionalData.protein}
              />
              <MetricCard
                icon="leaf"
                color="#4CAF50"
                title="Carbs"
                value={totalNutrition.carbs}
                target={nutritionalData.carbs}
              />
            </>
          ) : (
            <View style={[styles.setupPrompt, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="person-add" size={48} color={colors.textMuted} />
              <Text style={[styles.setupPromptTitle, { color: colors.text }]}>Complete Your Profile</Text>
              <Text style={[styles.setupPromptText, { color: colors.textSecondary }]}>
                Set up your personal information to get personalized nutrition
                targets and AI recommendations.
              </Text>
              <TouchableOpacity
                style={[styles.setupButton, { borderColor: colors.textSecondary }]}
                onPress={() => onNavigate?.("meals")}
              >
                <Text style={[styles.setupButtonText, { color: colors.textSecondary }]}>Go to Meals & Setup</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* View Toggle */}
        <View style={[styles.toggleContainer, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedView === "Daily" && [styles.toggleButtonActive, { backgroundColor: colors.primaryLight }],
            ]}
            onPress={() => setSelectedView("Daily")}
          >
            <Ionicons
              name="calendar"
              size={16}
              color={selectedView === "Daily" ? colors.text : colors.textMuted}
            />
            <Text
              style={[
                styles.toggleText,
                { color: colors.textMuted },
                selectedView === "Daily" && [styles.toggleTextActive, { color: colors.text }],
              ]}
            >
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedView === "Weekly" && [styles.toggleButtonActive, { backgroundColor: colors.primaryLight }],
            ]}
            onPress={() => setSelectedView("Weekly")}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={selectedView === "Weekly" ? colors.text : colors.textMuted}
            />
            <Text
              style={[
                styles.toggleText,
                { color: colors.textMuted },
                selectedView === "Weekly" && [styles.toggleTextActive, { color: colors.text }],
              ]}
            >
              Weekly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Meals */}
        <View style={styles.mealsContainer}>
          <View style={styles.mealRow}>
            {meals.slice(0, 2).map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </View>
          <View style={styles.mealRow}>
            {meals.slice(2, 4).map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateText: {
    fontSize: 16,
  },
  greetingContainer: {
    paddingHorizontal: 24,
    marginBottom: 36,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: "300",
  },
  questionText: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 8,
  },
  metricsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 36,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    minHeight: 120,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressBar: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    marginTop: 10,
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: "600",
  },
  toggleContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 24,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 6,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  toggleButtonActive: {},
  toggleText: {
    fontSize: 16,
  },
  toggleTextActive: {
    fontWeight: "600",
  },
  mealsContainer: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24
  },
  mealRow: {
    flexDirection: "row",
    gap: 16,
  },
  mealCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    minHeight: 120,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  mealTime: {
    fontSize: 14,
    marginTop: 4,
  },
  mealFood: {
    fontSize: 16,
    marginTop: 12,
  },
  setupPrompt: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    borderRadius: 20,
    marginTop: 20,
  },
  setupPromptTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },
  setupPromptText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  setupButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  setupButtonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
