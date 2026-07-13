import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DISCIPLINE_LEVELS } from '../../../constants/discipline';
import { ROUTES } from '../../../constants/routes';
import { useAnalyticsStore } from '../../../stores/analyticsStore';
import { useAuthStore } from '../../../stores/authStore';
import { useToastStore } from '../../../stores/toastStore';
import { convertToDate } from '../../../utils/dateUtils';
import { getErrorMessage } from '../../../utils/errors';
import { safeNotificationAsync, safeSelectionAsync, NotificationFeedbackType } from '../../../utils/haptics';
import { getProfileCompletion } from '../utils/profileCompletion';
import type { UserProfile } from '../../../types/firestore';

type AppearanceMode = 'Dark' | 'System' | 'High Contrast';

const APPEARANCE_KEY = 'altasai.appearanceMode';
const AI_MEMORY_KEY = 'altasai.aiMemoryEnabled';
const AI_MEMORY_RESET_KEY = 'altasai.aiMemoryResetAt';

export function useProfile() {
  const { user, profile, logout, updateProfile } = useAuthStore();
  const { dashboard, loadDashboard } = useAnalyticsStore();
  const showToast = useToastStore((state) => state.showToast);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [appearanceMode, setAppearanceMode] = useState<AppearanceMode>('Dark');
  const [aiMemoryEnabled, setAiMemoryEnabled] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    void AsyncStorage.multiGet([APPEARANCE_KEY, AI_MEMORY_KEY]).then((entries) => {
      const settings = Object.fromEntries(entries);
      const storedAppearance = settings[APPEARANCE_KEY] as AppearanceMode | null;
      if (storedAppearance === 'Dark' || storedAppearance === 'System' || storedAppearance === 'High Contrast') {
        setAppearanceMode(storedAppearance);
      }
      if (settings[AI_MEMORY_KEY] === 'false') {
        setAiMemoryEnabled(false);
      }
    });
  }, []);

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

  const profileCompletion = useMemo(() => getProfileCompletion(profile), [profile]);

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

  const setDisciplineLevel = async (level: keyof typeof DISCIPLINE_LEVELS) => {
    try {
      await updateProfile({ disciplineLevel: level });
      showToast(`Discipline level set to ${DISCIPLINE_LEVELS[level].name}.`, 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Could not update discipline level.'), 'error');
    }
  };

  const saveProfileChanges = async (data: Partial<Pick<UserProfile, 'displayName' | 'focusAreas' | 'lifeRhythm' | 'disciplineLevel'>>) => {
    try {
      await updateProfile(data);
      showToast('Profile updated.', 'success');
    } catch (error) {
      showToast(getErrorMessage(error, 'Could not update profile.'), 'error');
      throw error;
    }
  };

  const showDisciplineOptions = () => {
    safeSelectionAsync();
    Alert.alert(
      'Discipline Level',
      'Choose how direct AltasAI should be with you.',
      [
        { text: 'Mentor', onPress: () => void setDisciplineLevel('mentor') },
        { text: 'Strict Coach', onPress: () => void setDisciplineLevel('strict') },
        { text: 'Ruthless', onPress: () => void setDisciplineLevel('ruthless') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const saveAppearanceMode = async (mode: AppearanceMode) => {
    setAppearanceMode(mode);
    await AsyncStorage.setItem(APPEARANCE_KEY, mode);
    showToast(`Appearance set to ${mode}.`, 'success');
  };

  const showAppearanceOptions = () => {
    safeSelectionAsync();
    Alert.alert(
      'Appearance',
      'Choose the saved interface preference. The current app theme is optimized for dark mode.',
      [
        { text: 'Dark', onPress: () => void saveAppearanceMode('Dark') },
        { text: 'System', onPress: () => void saveAppearanceMode('System') },
        { text: 'High Contrast', onPress: () => void saveAppearanceMode('High Contrast') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const exportData = async () => {
    safeSelectionAsync();
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      account: {
        uid: user?.uid,
        email: user?.email,
        displayName: user?.displayName,
      },
      profile,
      dashboard,
      settings: {
        notificationsEnabled,
        hapticEnabled,
        appearanceMode,
        aiMemoryEnabled,
      },
    };

    const json = JSON.stringify(exportPayload, null, 2);

    if (Platform.OS === 'web') {
      const documentRef = (globalThis as unknown as { document?: Document }).document;
      const URLRef = (globalThis as unknown as { URL?: typeof URL }).URL;
      if (documentRef && URLRef) {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URLRef.createObjectURL(blob);
        const link = documentRef.createElement('a');
        link.href = url;
        link.download = `altasai-export-${new Date().toISOString().slice(0, 10)}.json`;
        documentRef.body.appendChild(link);
        link.click();
        link.remove();
        URLRef.revokeObjectURL(url);
        showToast('Export downloaded as JSON.', 'success');
        return;
      }
    }

    Alert.alert('Export data', json.slice(0, 1800));
  };

  const setAiMemory = async (enabled: boolean) => {
    setAiMemoryEnabled(enabled);
    await AsyncStorage.setItem(AI_MEMORY_KEY, String(enabled));
    showToast(enabled ? 'AI memory enabled.' : 'AI memory disabled for future mentor sessions.', 'success');
  };

  const resetAiMemory = async () => {
    await AsyncStorage.setItem(AI_MEMORY_RESET_KEY, new Date().toISOString());
    showToast('Local AI memory reset marker saved.', 'success');
  };

  const showAiMemoryControls = () => {
    safeSelectionAsync();
    Alert.alert(
      'AI Memory Control',
      aiMemoryEnabled
        ? 'AI memory is enabled for future mentor sessions.'
        : 'AI memory is disabled for future mentor sessions.',
      [
        { text: aiMemoryEnabled ? 'Disable Memory' : 'Enable Memory', onPress: () => void setAiMemory(!aiMemoryEnabled) },
        { text: 'Reset Local Memory', style: 'destructive', onPress: () => void resetAiMemory() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const showTermsAndPrivacy = () => {
    safeSelectionAsync();
    Alert.alert(
      'Terms and Privacy',
      [
        'AltasAI stores your app data under your Firebase user account.',
        'AI provider keys stay on the backend, not in the mobile app.',
        'Client writes are limited by Firestore security rules.',
        'Export data downloads your local account/profile/settings snapshot.',
        'Do not use AltasAI as medical, legal, or financial advice.',
      ].join('\n\n')
    );
  };

  const goToSecuritySettings = () => router.push(ROUTES.MAIN.SECURITY);

  return {
    user,
    profile,
    disciplineConfig,
    userStats,
    profileCompletion,
    notificationsEnabled,
    setNotificationsEnabled,
    hapticEnabled,
    setHapticEnabled,
    appearanceMode,
    aiMemoryEnabled,
    handleLogout,
    showDisciplineOptions,
    saveProfileChanges,
    showAppearanceOptions,
    goToSecuritySettings,
    exportData,
    showAiMemoryControls,
    showTermsAndPrivacy,
  };
}
