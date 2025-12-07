import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingNavigator from './src/navigation/OnboardingNavigator';
import { OnboardingContext } from './src/navigation/OnboardingContext';
import { NavigationContainer } from '@react-navigation/native';
import { lightNavigationTheme, darkNavigationTheme } from './src/theme';
import { loadPreferences } from './src/storage/preferences';
import { setThemePrimarySecondary } from './src/theme/colors';
import { ThemeProvider, useThemeColors, useThemeController } from './src/theme/ThemeContext';
import ThickSpinner from './src/components/ThickSpinner';
import AnimatedSplash from './src/components/AnimatedSplash';

import getPuzzlesData from './src/services/getData';

// Toggle to force showing onboarding in development
// Set to true during development to always see onboarding
const SHOW_ONBOARDING_ALWAYS = true;

const ONBOARDING_KEY = 'hasOnboarded';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [splashDone, setSplashDone] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  // In dev, start in onboarding even if stored as completed,
  // but allow switching to app after finishing within the session.
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
      } catch (e) {
        setHasOnboarded(false);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Show animated splash first, while we also load onboarding state.
  if (!splashDone) {
    return <AnimatedSplash onFinish={() => setSplashDone(true)} />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ThickSpinner size={110} thickness={12} />
      </View>
    );
  }

  // In development, start with onboarding but allow exit on completion
  const showOnboarding = devSessionOnboarding ? true : !hasOnboarded;

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    } finally {
      setHasOnboarded(true);
      // End dev-only onboarding for this session so app shows after completion
      setDevSessionOnboarding(false);
    }
  };

  // Build a navigation theme each render after provider mounts so primary/secondary update.
  const ThemedNav = () => {
    const colors = useThemeColors();
    // Clone a dark navigation theme but override primary + card + background colors.
    const navTheme = {
      ...darkNavigationTheme,
      colors: {
        ...darkNavigationTheme.colors,
        primary: colors.primary,
        card: colors.background,
        background: colors.background,
        text: colors.text,
        border: colors.border || darkNavigationTheme.colors.border,
      },
    };
    return (
      <NavigationContainer theme={navTheme}>
        {showOnboarding ? <OnboardingNavigator /> : <AppNavigator />}
      </NavigationContainer>
    );
  };

  return (
    <OnboardingContext.Provider value={{ completeOnboarding }}>
      <ThemeProvider initialTheme={initialTheme}>
        <ThemedNav />
      </ThemeProvider>
    </OnboardingContext.Provider>
  );
}

// Onboarding completion is handled through OnboardingContext
