import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/components/ToastConfig';
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
  Modal,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context"

const SettingsScreen = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const { isDark, themeMode, setThemeMode, colors } = useTheme();
  const { signOut, user } = useAuth();

  const getThemeModeLabel = (mode: ThemeMode) => {
    switch (mode) {
      case 'system': return 'System';
      case 'light': return 'Light';
      case 'dark': return 'Dark';
    }
  };

  const handleThemeSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
    setShowThemeModal(false);
    showToast.success('Theme Updated', `Theme set to ${getThemeModeLabel(mode)}`);
  };

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
            icon="color-palette"
            title="Theme"
            subtitle={getThemeModeLabel(themeMode)}
            onPress={() => setShowThemeModal(true)}
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

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowThemeModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Theme</Text>

            {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.themeOption,
                  { backgroundColor: themeMode === mode ? colors.primaryLight : 'transparent' }
                ]}
                onPress={() => handleThemeSelect(mode)}
              >
                <Ionicons
                  name={mode === 'system' ? 'phone-portrait-outline' : mode === 'light' ? 'sunny-outline' : 'moon-outline'}
                  size={22}
                  color={themeMode === mode ? colors.primary : colors.text}
                />
                <Text style={[
                  styles.themeOptionText,
                  { color: themeMode === mode ? colors.primary : colors.text }
                ]}>
                  {getThemeModeLabel(mode)}
                </Text>
                {themeMode === mode && (
                  <Ionicons name="checkmark" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalCancelButton, { borderTopColor: colors.border }]}
              onPress={() => setShowThemeModal(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingBottom: 34,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    borderRadius: 12,
    gap: 14,
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  modalCancelButton: {
    borderTopWidth: 1,
    paddingVertical: 16,
    marginTop: 12,
    marginHorizontal: 20,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});