import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { MealPlanProvider } from '../components/MealPlanContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ToastProvider, ToastRefSetter } from '@/components/ToastConfig';
import { NetworkProvider, useNetwork } from '@/context/NetworkContext';
import { NoInternetScreen } from '@/components/NoInternetScreen';
import { ProfileProvider, useProfile } from '@/context/ProfileContext';
import { OnboardingScreen } from '@/components/OnboardingScreen';

function RootLayoutContent() {
  const { isDark, colors } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const { isConnected, isInternetReachable } = useNetwork();
  const { isLoading: profileLoading, showOnboarding, skipOnboarding, refreshProfile, isOnboardingComplete } = useProfile();
  const segments = useSegments();
  const router = useRouter();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const isLoading = authLoading || profileLoading;

  useEffect(() => {
    if (isLoading || !loaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // User is not signed in and not on auth screen, redirect to sign-in
      router.replace('/(auth)/sign-in' as Href);
    } else if (user && inAuthGroup) {
      // User is signed in but on auth screen, redirect to main app
      router.replace('/(tabs)' as Href);
    }
  }, [user, segments, isLoading, loaded]);

  // Show loading screen while fonts/auth/profile are loading
  if (!loaded || isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Show no internet screen when offline
  if (isConnected === false || isInternetReachable === false) {
    return <NoInternetScreen />;
  }

  // Show onboarding screen for new users who haven't completed profile
  // Or for users editing their profile
  if (user && showOnboarding) {
    return (
      <OnboardingScreen
        onComplete={refreshProfile}
        onSkip={skipOnboarding}
        isEditMode={isOnboardingComplete}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <MealPlanProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" options={{ headerShown: true }} />
          </Stack>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </MealPlanProvider>
      </NavigationThemeProvider>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <NetworkProvider>
        <AuthProvider>
          <ProfileProvider>
            <ToastProvider>
              <ToastRefSetter />
              <RootLayoutContent />
            </ToastProvider>
          </ProfileProvider>
        </AuthProvider>
      </NetworkProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

