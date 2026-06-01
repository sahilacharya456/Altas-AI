export const colors = {
  background: {
    DEFAULT: '#0A0A0F',
    secondary: '#12121A',
    tertiary: '#1A1A25',
  },
  surface: {
    DEFAULT: '#1E1E2A',
    elevated: '#252535',
    pressed: '#2A2A3A',
  },
  primary: {
    DEFAULT: '#6366F1',
    light: '#818CF8',
    dark: '#4F46E5',
  },
  accent: {
    DEFAULT: '#22D3EE',
    light: '#67E8F9',
    dark: '#06B6D4',
  },
  success: {
    DEFAULT: '#10B981',
    light: '#34D399',
    dark: '#059669',
  },
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
  },
  error: {
    DEFAULT: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
  },
  text: {
    DEFAULT: '#FFFFFF',
    secondary: '#A1A1AA',
    tertiary: '#71717A',
    muted: '#52525B',
  },
  border: {
    DEFAULT: '#27272A',
    light: '#3F3F46',
  },
  discipline: {
    mentor: '#22D3EE',
    strict: '#F59E0B',
    ruthless: '#EF4444',
  },
} as const;

export type ColorScheme = typeof colors;
