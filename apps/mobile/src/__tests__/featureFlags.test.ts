import { FEATURE_FLAGS, isEnabled } from '../config/featureFlags';

describe('Feature flags', () => {
  test('core MVP features are enabled', () => {
    expect(FEATURE_FLAGS.TASKS).toBe(true);
    expect(FEATURE_FLAGS.FOCUS).toBe(true);
    expect(FEATURE_FLAGS.REFLECTION).toBe(true);
    expect(FEATURE_FLAGS.MENTOR).toBe(true);
    expect(FEATURE_FLAGS.CORTEX).toBe(true);
    expect(FEATURE_FLAGS.INTERVENTIONS).toBe(true);
    expect(FEATURE_FLAGS.GOALS).toBe(true);
    expect(FEATURE_FLAGS.REPORTS).toBe(true);
    expect(FEATURE_FLAGS.PROFILE).toBe(true);
  });

  test('postponed features are disabled in production', () => {
    // These must stay false until the feature meets the demo bar
    expect(FEATURE_FLAGS.FINANCE_KHATA).toBe(false);
    expect(FEATURE_FLAGS.NEWS_LAB).toBe(false);
    expect(FEATURE_FLAGS.SECURITY_SCAN_LINK).toBe(false);
    expect(FEATURE_FLAGS.DEVICE_SAFETY).toBe(false);
  });

  test('isEnabled helper returns correct values', () => {
    expect(isEnabled('TASKS')).toBe(true);
    expect(isEnabled('NEWS_LAB')).toBe(false);
    expect(isEnabled('FINANCE_KHATA')).toBe(false);
  });
});
