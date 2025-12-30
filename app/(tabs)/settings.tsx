import { useTheme } from '../../components/ThemeContext';
import { useAuth } from '../../components/AuthContext';
import { showToast } from '../../components/ToastConfig';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context"

const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { isDark, toggleTheme, colors } = useTheme();
  const { signOut, user } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            showToast.success('Logged Out', 'You have been signed out successfully');
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showSwitch = false,
    switchValue = false,
    onSwitchChange = () => { },
    showArrow = true
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {showSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.switchTrackInactive, true: colors.primary }}
          thumbColor={switchValue ? '#fff' : colors.switchThumb}
        />
      ) : showArrow && onPress ? (
        <Ionicons name="chevron-forward" size={20} color={colors.iconMuted} />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App Settings</Text>
          <SettingItem
            icon="notifications"
            title="Notifications"
            subtitle="Get reminders for meals"
            showSwitch={true}
            switchValue={notificationsEnabled}
            onSwitchChange={setNotificationsEnabled}
            showArrow={false}
          />
          <SettingItem
            icon="moon"
            title="Dark Mode"
            subtitle="Use dark theme"
            showSwitch={true}
            switchValue={isDark}
            onSwitchChange={toggleTheme}
            showArrow={false}
          />
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <SettingItem
            icon="person"
            title="Profile"
            subtitle="View and edit your profile"
            onPress={() => {
              // Navigate to profile
            }}
          />
          <SettingItem
            icon="fitness"
            title="Health Goals"
            subtitle="Set your nutrition targets"
            onPress={() => {
              // Navigate to health goals
            }}
          />
          <SettingItem
            icon="restaurant"
            title="Dietary Preferences"
            subtitle="Allergies and restrictions"
            onPress={() => {
              // Navigate to dietary preferences
            }}
          />
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App Information</Text>
          <SettingItem
            icon="information-circle"
            title="Version"
            subtitle="1.0.0"
            showArrow={false}
          />
          <SettingItem
            icon="document-text"
            title="Privacy Policy"
            onPress={() => {
              // Open privacy policy
            }}
          />
          <SettingItem
            icon="shield-checkmark"
            title="Terms of Service"
            onPress={() => {
              // Open terms of service
            }}
          />
          <SettingItem
            icon="help-circle"
            title="Help & Support"
            onPress={() => {
              // Open help
            }}
          />
        </View>

        {/* Logout */}
        <View style={styles.section}>
          {user && (
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              Signed in as {user.email}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.dangerBackground }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.accent} />
            <Text style={[styles.logoutButtonText, { color: colors.accent }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 4,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 0,
  },
  settingContent: {
    flex: 1,

  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    marginHorizontal: 20,
  },
});