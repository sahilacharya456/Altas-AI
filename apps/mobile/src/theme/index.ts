/**
 * AltasAI - Unified Theme System
 * Export all design tokens
 */

export * from './colors';
export * from './typography';
export * from './motion';
export * from './spacing';
export * from './radius';
export * from './shadows';
export * from './gradients';
export * from './layout';

import { ALTASAI_COLORS } from './colors';
import { ALTASAI_TYPOGRAPHY } from './typography';
import { ALTASAI_MOTION } from './motion';
import { ALTASAI_SPACING } from './spacing';
import { ALTASAI_RADIUS } from './radius';
import { ALTASAI_SHADOWS } from './shadows';
import { ALTASAI_GRADIENTS } from './gradients';
import { ALTASAI_LAYOUT } from './layout';

export const ALTASAI_SCREENS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Unified theme object
export const theme = {
  colors: ALTASAI_COLORS,
  typography: ALTASAI_TYPOGRAPHY,
  motion: ALTASAI_MOTION,
  animation: ALTASAI_MOTION, // Alias for compatibility
  spacing: ALTASAI_SPACING,
  radius: ALTASAI_RADIUS,
  shadows: ALTASAI_SHADOWS,
  gradients: ALTASAI_GRADIENTS,
  layout: ALTASAI_LAYOUT,
  screens: ALTASAI_SCREENS,
} as const;
