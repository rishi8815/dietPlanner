import { CustomBottomNav, NAV_ITEMS } from '@/components/CustomBottomNav';
import { useTheme } from '@/context/ThemeContext';
import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  StatusBar,
  ScrollView,
  View,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Tab order for swipe navigation
const TAB_ORDER = ['home', 'meals', 'profile', 'settings'];

export default function TabLayout() {
  const [activeTab, setActiveTab] = useState('home');
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);

  const handleTabPress = useCallback((tabId: string) => {
    const tabIndex = TAB_ORDER.indexOf(tabId);
    if (tabIndex !== -1 && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: tabIndex * SCREEN_WIDTH,
        animated: true,
      });
    }
    setActiveTab(tabId);
  }, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Only update active tab during user scrolling to keep bottom nav in sync
    if (isScrolling.current) {
      const offsetX = event.nativeEvent.contentOffset.x;
      const tabIndex = Math.round(offsetX / SCREEN_WIDTH);
      const newTab = TAB_ORDER[tabIndex];
      if (newTab && newTab !== activeTab) {
        setActiveTab(newTab);
      }
    }
  }, [activeTab]);

  const handleScrollBeginDrag = useCallback(() => {
    isScrolling.current = true;
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    isScrolling.current = false;
  }, []);

  const handleMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const tabIndex = Math.round(offsetX / SCREEN_WIDTH);
    const newTab = TAB_ORDER[tabIndex];
    if (newTab) {
      setActiveTab(newTab);
    }
    isScrolling.current = false;
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <StatusBar hidden={false} />

      {/* Horizontal Paged ScrollView for smooth swiping like Instagram */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={styles.scrollView}
        decelerationRate={0.6}
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
        disableIntervalMomentum={true}
      >
        {/* Home Screen */}
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
          <HomeScreen onNavigate={handleTabPress} />
        </View>

        {/* Meals Screen */}
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
          <MealsScreen />
        </View>

        {/* Profile Screen */}
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
          <ProfileScreen />
        </View>

        {/* Settings Screen */}
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
          <SettingsScreen />
        </View>
      </ScrollView>

      {/* Custom Bottom Navigation */}
      <CustomBottomNav
        items={NAV_ITEMS}
        activeTab={activeTab}
        onTabPress={handleTabPress}
      />
    </SafeAreaView>
  );
}

// Import the screen components
import HomeScreen from './index';
import MealsScreen from './meals';
import ProfileScreen from './profile';
import SettingsScreen from './settings';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  screen: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
});
