import { ROUTES } from '../constants/routes';
import type { UserProfile } from '../types/firestore';

interface ResolveInitialRouteInput {
  isInitialized: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  profile: Pick<UserProfile, 'onboardingCompleted'> | null;
}

export const resolveInitialRoute = ({
  isInitialized,
  isLoading,
  isAuthenticated,
  profile,
}: ResolveInitialRouteInput): string | null => {
  if (!isInitialized || isLoading) return null;
  if (!isAuthenticated) return ROUTES.AUTH.WELCOME;
  if (!profile || !profile.onboardingCompleted) return ROUTES.AUTH.ONBOARDING;
  return ROUTES.MAIN.HOME;
};
