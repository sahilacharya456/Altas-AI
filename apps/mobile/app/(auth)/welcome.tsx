import React from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AltasAICoreVisual } from '../../src/components/ui';
import { useNetworkStatus } from '../../src/hooks';
import { ROUTES } from '../../src/constants/routes';
import {
  ALTASAI_COLORS,
  ALTASAI_RADIUS,
  ALTASAI_SPACING,
  ALTASAI_TYPOGRAPHY,
} from '../../src/theme';
import { safeImpactAsync, ImpactFeedbackStyle } from '../../src/utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CORE_SIZE = Math.min(SCREEN_WIDTH * 0.86, SCREEN_HEIGHT * 0.48, 390);

export default function WelcomeScreen() {
  const network = useNetworkStatus();
  const isOnline = network.isConnected && network.isInternetReachable;

  const handleLogin = () => {
    safeImpactAsync(ImpactFeedbackStyle.Light);
    router.push(ROUTES.AUTH.LOGIN);
  };

  const handleRegister = () => {
    safeImpactAsync(ImpactFeedbackStyle.Medium);
    router.push(ROUTES.AUTH.REGISTER);
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#020403', '#030504', '#060A08']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.topAtmosphere} />
      <View style={styles.coreAtmosphere} />
      <View style={styles.floorGlow} />

      <SafeAreaView style={styles.safe}>
        <Animated.View entering={FadeIn.duration(520)} style={styles.topBar}>
          <Text style={styles.wordmark}>ALTASAI</Text>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, !isOnline && styles.statusDotOffline]} />
            <Text style={styles.statusText}>{isOnline ? 'Core online' : 'Offline'}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(120).duration(680)} style={styles.coreStage}>
          <AltasAICoreVisual
            size={CORE_SIZE}
            label="AltasAI Core"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).duration(560)} style={styles.bottom}>
          <Text style={styles.systemLabel}>Personal Discipline OS</Text>
          <Text style={styles.title}>Discipline, measured.</Text>
          <Text style={styles.subtitle}>Command your day before it controls you.</Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Begin Command"
              onPress={handleRegister}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            >
              <LinearGradient
                colors={['rgba(166, 255, 231, 0.98)', 'rgba(53, 232, 180, 0.92)', 'rgba(13, 122, 93, 0.92)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Text style={styles.primaryButtonText}>Begin Command</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="I already have access"
              onPress={handleLogin}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.secondaryButtonText}>I already have access</Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020403',
    overflow: 'hidden',
  },
  safe: {
    flex: 1,
    paddingHorizontal: ALTASAI_SPACING.xl,
    paddingBottom: ALTASAI_SPACING.xl,
  },
  topAtmosphere: {
    position: 'absolute',
    top: -150,
    alignSelf: 'center',
    width: SCREEN_WIDTH * 1.2,
    height: 320,
    borderRadius: 180,
    backgroundColor: 'rgba(53, 232, 180, 0.045)',
  },
  coreAtmosphere: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.18,
    alignSelf: 'center',
    width: SCREEN_WIDTH * 0.94,
    height: SCREEN_WIDTH * 0.94,
    borderRadius: SCREEN_WIDTH,
    backgroundColor: 'rgba(53, 232, 180, 0.035)',
  },
  floorGlow: {
    position: 'absolute',
    bottom: -120,
    alignSelf: 'center',
    width: SCREEN_WIDTH * 1.1,
    height: 260,
    borderRadius: 160,
    backgroundColor: 'rgba(166, 255, 231, 0.04)',
  },
  topBar: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    letterSpacing: 0,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: ALTASAI_SPACING.sm,
    paddingVertical: 7,
    borderRadius: ALTASAI_RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(166, 255, 231, 0.12)',
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ALTASAI_COLORS.intelligence.core,
    shadowColor: ALTASAI_COLORS.intelligence.core,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.82,
    shadowRadius: 8,
  },
  statusDotOffline: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  statusText: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
  },
  coreStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 330,
    marginTop: -ALTASAI_SPACING.md,
  },
  bottom: {
    gap: ALTASAI_SPACING.xs,
    paddingBottom: ALTASAI_SPACING.sm,
  },
  systemLabel: {
    color: ALTASAI_COLORS.intelligence.core,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  title: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size['3xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    lineHeight: ALTASAI_TYPOGRAPHY.size['3xl'] * 1.08,
  },
  subtitle: {
    maxWidth: 360,
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    lineHeight: ALTASAI_TYPOGRAPHY.size.base * 1.42,
  },
  actions: {
    marginTop: ALTASAI_SPACING.lg,
    gap: ALTASAI_SPACING.sm,
  },
  primaryButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: ALTASAI_RADIUS.xl,
    shadowColor: ALTASAI_COLORS.intelligence.core,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  primaryButtonText: {
    color: '#03100C',
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
  },
  secondaryButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ALTASAI_RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(166, 255, 231, 0.14)',
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
  },
  secondaryButtonText: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
