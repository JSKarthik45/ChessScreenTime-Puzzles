export const palette = {
  primary: '#739552',
  primaryDark: '#739552',
  secondary: '#ebecd0',
  background: '#000000ff',
  surface: '#f5f7fb',
  text: '#0f172a',
  muted: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  border: '#e5e7eb',
};

export const lightColors = {
  primary: palette.primary,
  secondary: palette.secondary,
  background: '#000000ff',
  surface: '#383838ff',
  text: '#e5e7eb',
  muted: '#9ca3af',
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
  border: '#1f2937',
};

export const darkColors = {
  primary: palette.primary,
  secondary: palette.secondary,
  background: '#000000ff',
  surface: '#383838ff',
  text: '#e5e7eb',
  muted: '#9ca3af',
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
  border: '#1f2937',
};

// Runtime setter to allow dynamic theme switching for primary/secondary.
export function setThemePrimarySecondary(primary, secondary) {
  if (primary) {
    palette.primary = primary;
    palette.primaryDark = primary;
    lightColors.primary = primary;
    darkColors.primary = primary;
  }
  if (secondary) {
    palette.secondary = secondary;
    lightColors.secondary = secondary;
    darkColors.secondary = secondary;
  }
}
