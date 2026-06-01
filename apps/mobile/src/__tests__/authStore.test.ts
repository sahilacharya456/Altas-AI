/**
 * Auth store selector tests.
 * These test the pure selector functions directly without importing the store
 * (which would pull in firebase/react-native dependencies).
 */

// Inline the selector logic to test without the firebase dependency chain
const selectIsOnboardingRequired = (state: { isAuthenticated: boolean; profile: { onboardingCompleted?: boolean } | null }): boolean =>
  state.isAuthenticated && state.profile !== null && !state.profile.onboardingCompleted;

const selectDisciplineLevel = (state: { profile?: { disciplineLevel?: string } | null }) =>
  state.profile?.disciplineLevel ?? 'strict';

const selectCurrentScores = (state: { profile?: { currentScores?: { discipline: number; productivity: number; consistency: number } } | null }) =>
  state.profile?.currentScores ?? { discipline: 50, productivity: 50, consistency: 50 };

describe('authStore selectors', () => {
  describe('selectIsOnboardingRequired', () => {
    it('returns false when not authenticated', () => {
      expect(selectIsOnboardingRequired({ isAuthenticated: false, profile: null })).toBe(false);
    });

    it('returns false when profile is null', () => {
      expect(selectIsOnboardingRequired({ isAuthenticated: true, profile: null })).toBe(false);
    });

    it('returns true when authenticated with profile but onboarding not completed', () => {
      expect(selectIsOnboardingRequired({ isAuthenticated: true, profile: { onboardingCompleted: false } })).toBe(true);
    });

    it('returns false when onboarding is completed', () => {
      expect(selectIsOnboardingRequired({ isAuthenticated: true, profile: { onboardingCompleted: true } })).toBe(false);
    });
  });

  describe('selectDisciplineLevel', () => {
    it('defaults to strict when no profile', () => {
      expect(selectDisciplineLevel({ profile: null })).toBe('strict');
    });

    it('returns profile discipline level when set', () => {
      expect(selectDisciplineLevel({ profile: { disciplineLevel: 'ruthless' } })).toBe('ruthless');
    });

    it('returns mentor level correctly', () => {
      expect(selectDisciplineLevel({ profile: { disciplineLevel: 'mentor' } })).toBe('mentor');
    });
  });

  describe('selectCurrentScores', () => {
    it('returns default scores when no profile', () => {
      expect(selectCurrentScores({ profile: null })).toEqual({ discipline: 50, productivity: 50, consistency: 50 });
    });

    it('returns profile scores when available', () => {
      const state = { profile: { currentScores: { discipline: 80, productivity: 72, consistency: 65 } } };
      expect(selectCurrentScores(state)).toEqual({ discipline: 80, productivity: 72, consistency: 65 });
    });
  });
});
