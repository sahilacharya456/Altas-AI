import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import { DISCIPLINE_LEVELS } from '../../../constants/discipline';
import { ROUTES } from '../../../constants/routes';
import { useAnalyticsStore } from '../../../stores/analyticsStore';
import { useAuthStore } from '../../../stores/authStore';
import { convertToDate } from '../../../utils/dateUtils';
import { safeNotificationAsync, safeSelectionAsync, NotificationFeedbackType } from '../../../utils/haptics';

export function useProfile() {
  const { user, profile, logout } = useAuthStore();
  const { dashboard, loadDashboard } = useAnalyticsStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const disciplineConfig = profile?.disciplineLevel
    ? DISCIPLINE_LEVELS[profile.disciplineLevel]
    : DISCIPLINE_LEVELS.strict;

  const userStats = useMemo(() => {
    const daysActive = profile?.createdAt
      ? Math.ceil((Date.now() - convertToDate(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 1;

    return {
      joinedDays: daysActive,
      focusMinutes: dashboard?.today.focusMinutes || 0,
      productivityScore: dashboard?.scores.productivity || 50,
      streak: dashboard?.streakDays || 0,
    };
  }, [
    dashboard?.scores.productivity,
    dashboard?.streakDays,
    dashboard?.today.focusMinutes,
    profile?.createdAt,
  ]);

  const handleLogout = () => {
    safeNotificationAsync(NotificationFeedbackType.Warning);
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace(ROUTES.AUTH.WELCOME);
          },
        },
      ]
    );
  };

  const showUnavailable = (label: string) => {
    safeSelectionAsync();
    Alert.alert(
      label,
      'This control is reserved for production settings. It is visible so privacy and account controls stay explicit, but it is not active yet.'
    );
  };

  const goToDisciplineSetup = () => router.push(ROUTES.AUTH.ONBOARDING);
  const goToSecuritySettings = () => router.push(ROUTES.MAIN.SECURITY);

  return {
    user,
    profile,
    disciplineConfig,
    userStats,
    notificationsEnabled,
    setNotificationsEnabled,
    hapticEnabled,
    setHapticEnabled,
    handleLogout,
    showUnavailable,
    goToDisciplineSetup,
    goToSecuritySettings,
  };
}
