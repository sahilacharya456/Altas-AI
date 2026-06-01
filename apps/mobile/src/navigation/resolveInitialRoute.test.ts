import { ROUTES } from '../constants/routes';
import { resolveInitialRoute } from './resolveInitialRoute';

describe('resolveInitialRoute', () => {
  test('waits while auth/profile state is still loading', () => {
    expect(resolveInitialRoute({
      isInitialized: false,
      isLoading: true,
      isAuthenticated: false,
      profile: null,
    })).toBeNull();
  });

  test('sends signed-out users to welcome', () => {
    expect(resolveInitialRoute({
      isInitialized: true,
      isLoading: false,
      isAuthenticated: false,
      profile: null,
    })).toBe(ROUTES.AUTH.WELCOME);
  });

  test('sends authenticated users without onboarding to onboarding', () => {
    expect(resolveInitialRoute({
      isInitialized: true,
      isLoading: false,
      isAuthenticated: true,
      profile: { onboardingCompleted: false },
    })).toBe(ROUTES.AUTH.ONBOARDING);
  });

  test('sends fully onboarded users to main home', () => {
    expect(resolveInitialRoute({
      isInitialized: true,
      isLoading: false,
      isAuthenticated: true,
      profile: { onboardingCompleted: true },
    })).toBe(ROUTES.MAIN.HOME);
  });
});
