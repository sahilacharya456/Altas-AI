/**
 * AltasAI Feature Flags
 *
 * Controls visibility of features that are real but not MVP-polished enough
 * for the demo launch. All flags default to false (hidden) in production.
 * Set to true in development or when the feature meets the demo bar.
 *
 * Rule: A flag is only set to true when the feature has:
 *   - A working backend route (or works fully client-side)
 *   - Loading, empty, and error states
 *   - No placeholder copy in the visible UI
 */

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

export const FEATURE_FLAGS = {
  // --- MVP Core (always on) ---
  TASKS: true,
  FOCUS: true,
  REFLECTION: true,
  MENTOR: true,
  CORTEX: true,
  INTERVENTIONS: true,
  GOALS: true,
  REPORTS: true,
  PROFILE: true,
  ANALYTICS: true,

  // --- Secondary features (enabled only in dev until polished) ---
  HEALTH: isDev,
  DIGITAL_DISCIPLINE: isDev,
  BEHAVIOR_TIMELINE: isDev,

  // --- Postponed: requires separate product decision ---
  FINANCE_KHATA: false,
  NEWS_LAB: false,
  SECURITY_SCAN_LINK: false,
  DEVICE_SAFETY: false,
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export const isEnabled = (flag: FeatureFlag): boolean => FEATURE_FLAGS[flag];
