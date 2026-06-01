import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LoadingState } from '../../components/feedback';
import { NotificationService } from '../../services/notifications';
import { cleanupAuth, useAuthStore } from '../../stores/authStore';
import { ALTASAI_COLORS } from '../../theme';

export function RootNavigator() {
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    initialize();

    (async () => {
      const granted = await NotificationService.initialize();
      if (granted) {
        await NotificationService.scheduleMorningBriefing();
        await NotificationService.scheduleDailyReflection();
      }
    })();

    return () => cleanupAuth();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <LoadingState
        title="Preparing AltasAI"
        message="Loading your command center."
      />
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: ALTASAI_COLORS.background.primary }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: ALTASAI_COLORS.background.primary },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(main)" />
        </Stack>
      </View>
    </>
  );
}
