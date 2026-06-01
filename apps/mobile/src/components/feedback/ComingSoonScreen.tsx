import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GradientButton } from '../common/GradientButton';
import { ALTASAI_COLORS } from '../../theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../theme/typography';
import { ALTASAI_SPACING } from '../../theme/spacing';

interface ComingSoonScreenProps {
  title?: string;
  message?: string;
}

export function ComingSoonScreen({
  title = 'Coming in a future update',
  message = 'This module is not part of the current execution loop. Focus on tasks, reflection, and mentor first.',
}: ComingSoonScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>NOT AVAILABLE YET</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <GradientButton
          title="Back to Dashboard"
          onPress={() => router.replace('/(main)' as any)}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ALTASAI_COLORS.background.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ALTASAI_SPACING.xl,
    gap: ALTASAI_SPACING.md,
  },
  eyebrow: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: '700' as const,
    letterSpacing: 2,
    color: ALTASAI_COLORS.text.muted,
    textTransform: 'uppercase' as const,
  },
  title: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xl,
    fontWeight: '700' as const,
    color: ALTASAI_COLORS.text.primary,
    textAlign: 'center' as const,
  },
  message: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.secondary,
    textAlign: 'center' as const,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * 1.6,
  },
  button: {
    marginTop: ALTASAI_SPACING.lg,
    width: '100%',
  },
});
