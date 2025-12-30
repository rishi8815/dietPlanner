import { useMealPlan } from '../../components/MealPlanContext';
import { useTheme } from '@/components/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {SafeAreaView,}from "react-native-safe-area-context"
const ProfileScreen = () => {
  const { getTotalNutrition, nutritionalData } = useMealPlan();
  const totalNutrition = getTotalNutrition();
  const { colors, isDark } = useTheme();
  const router = useRouter()
  const ProfileCard = ({
    icon,
    color,
    title,
    value,
    subtitle
  }: {
    icon: string;
    color: string;
    title: string;
    value: string;
    subtitle?: string;
  }) => (
    <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.profileIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={20} color="white" />
      </View>
      <View style={styles.profileContent}>
        <Text style={[styles.profileTitle, { color: colors.textSecondary }]}>{title}</Text>
        <Text style={[styles.profileValue, { color: colors.text }]}>{value}</Text>
        {subtitle && <Text style={[styles.profileSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
      </View>
    </View>
  );

  const AchievementCard = ({
    icon,
    title,
    description,
    achieved
  }: {
    icon: string;
    title: string;
    description: string;
    achieved: boolean;
  }) => (
    <View style={[
      styles.achievementCard,
      { backgroundColor: colors.surface },
      achieved && styles.achievementCardAchieved
    ]}>
      <View style={[
        styles.achievementIcon,
        { backgroundColor: isDark ? colors.surfaceSecondary : '#F0F0F0' },
        achieved && { backgroundColor: colors.primaryLight }
      ]}>
        <Ionicons name={icon as any} size={20} color={achieved ? colors.primary : colors.textMuted} />
      </View>
      <View style={styles.achievementContent}>
        <Text style={[
          styles.achievementTitle,
          { color: colors.textMuted },
          achieved && { color: colors.text }
        ]}>
          {title}
        </Text>
        <Text style={[styles.achievementDescription, { color: colors.textSecondary }]}>{description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
          <TouchableOpacity onPress={()=>router.push("./settings")} style={styles.headerButton}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userSection}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>T</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>Tanim</Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>tanim@example.com</Text>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <ProfileCard
              icon="flame"
              color="#FFC107"
              title="Total Calories"
              value={`${totalNutrition.calories} kcal`}
              subtitle={`${Math.round((totalNutrition.calories / nutritionalData.calories) * 100)}% of daily goal`}
            />
            <ProfileCard
              icon="trophy"
              color="#FFD700"
              title="Streak"
              value="7 days"
              subtitle="Current streak"
            />
            <ProfileCard
              icon="checkmark-circle"
              color="#4CAF50"
              title="Meals Completed"
              value="3/4"
              subtitle="Today's progress"
            />
            <ProfileCard
              icon="trending-up"
              color="#2196F3"
              title="Weekly Average"
              value="85%"
              subtitle="Goal completion"
            />
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
          <AchievementCard
            icon="star"
            title="First Week"
            description="Complete 7 days of meal planning"
            achieved={true}
          />
          <AchievementCard
            icon="nutrition"
            title="Protein Master"
            description="Meet protein goals for 5 consecutive days"
            achieved={true}
          />
          <AchievementCard
            icon="leaf"
            title="Healthy Eater"
            description="Stay within calorie goals for 10 days"
            achieved={false}
          />
          <AchievementCard
            icon="fitness"
            title="Consistency King"
            description="Plan meals for 30 consecutive days"
            achieved={false}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Help & Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="share-outline" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Share Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  headerButton: {
    padding: 8,
  },
  userSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileContent: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: 12,
  },
  achievementsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    opacity: 0.6,
  },
  achievementCardAchieved: {
    opacity: 1,
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});