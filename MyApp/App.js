import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import { OnboardingContext } from './src/navigation/OnboardingContext';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { loadPreferences } from './src/storage/preferences';
import { setThemePrimarySecondary } from './src/theme/colors';
import { ThemeProvider, useThemeColors } from './src/theme/ThemeContext';
import { scheduleAllWindowNotifications } from './src/services/notifications';

// Toggle to force showing onboarding in development
const SHOW_ONBOARDING_ALWAYS = false;

const ONBOARDING_KEY = 'hasOnboarded';

// Separate component so NavigationContainer doesn't remount on every App render
function ThemedNavigation({ showOnboarding }) {
  const colors = useThemeColors();
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border || DefaultTheme.colors.border,
      notification: colors.primary,
    },
  };
  return (
    <NavigationContainer theme={navTheme}>
      {showOnboarding ? <OnboardingNavigator /> : <AppNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [devSessionOnboarding, setDevSessionOnboarding] = useState(SHOW_ONBOARDING_ALWAYS);
  const [initialTheme, setInitialTheme] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasOnboarded(value === 'true');
        const prefs = await loadPreferences();
        if (prefs.theme) {
          setThemePrimarySecondary(prefs.theme.primary, prefs.theme.secondary);
          setInitialTheme(prefs.theme);
        }
        // Re-schedule all window notifications on every app launch for reliability
        scheduleAllWindowNotifications().catch(() => {});
      } catch (e) {
        setHasOnboarded(false);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return null;
  }

  const showOnboarding = devSessionOnboarding ? true : !hasOnboarded;

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } finally {
      setHasOnboarded(true);
      setDevSessionOnboarding(false);
    }
    // Schedule notifications after onboarding completes
    scheduleAllWindowNotifications().catch(() => {});
  };

  return (
    <OnboardingContext.Provider value={{ completeOnboarding }}>
      <ThemeProvider initialTheme={initialTheme}>
        <ThemedNavigation showOnboarding={showOnboarding} />
      </ThemeProvider>
    </OnboardingContext.Provider>
  );
}
