import React, { createContext, useContext, useState, useCallback } from 'react';
import { setThemePrimarySecondary, lightColors } from './colors';

const ThemeContext = createContext({
  applyTheme: () => {},
  themeKey: 'classic',
  colors: lightColors,
  version: 0,
});

export function ThemeProvider({ children, initialTheme }) {
  const [themeKey, setThemeKey] = useState(initialTheme?.key || 'classic');
  const [version, setVersion] = useState(0); // force consumers to re-render
  const [colors, setColors] = useState({ ...lightColors });

  const applyTheme = useCallback((theme) => {
    if (!theme || !theme.primary || !theme.secondary) return;
    setThemePrimarySecondary(theme.primary, theme.secondary);
    setThemeKey(theme.key || 'custom');
    // capture a fresh snapshot so style recalculation hooks see new object reference
    setColors({ ...lightColors });
    setVersion(v => v + 1); // bump to trigger context change
  }, []);

  return (
    <ThemeContext.Provider value={{ applyTheme, themeKey, version, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeController() {
  return useContext(ThemeContext);
}

export function useThemeColors() {
  return useContext(ThemeContext).colors;
}

export function useThemedStyles(factory) {
  const { colors, version } = useThemeController();
  return React.useMemo(() => factory(colors), [colors, version, factory]);
}
