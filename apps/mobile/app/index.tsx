import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { LoadingState } from '../src/components/feedback';
import { resolveInitialRoute } from '../src/navigation/resolveInitialRoute';

export default function Index() {
  const { isAuthenticated, isInitialized, isLoading, profile } = useAuthStore();

  useEffect(() => {
    // Only route if we are fully initialized and not currently loading auth/profile data
    if (!isInitialized || isLoading) return;

    const nextRoute = resolveInitialRoute({ isInitialized, isLoading, isAuthenticated, profile });
    if (nextRoute) router.replace(nextRoute as any);
  }, [isAuthenticated, isInitialized, isLoading, profile]);

  // While deciding where to route, or while initializing/loading, show a spinner
  return <LoadingState title="Preparing AltasAI" />;
}
