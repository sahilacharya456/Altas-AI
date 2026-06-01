import React from 'react';
import { ActivityIndicator, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';

interface LoadingStateProps {
  title?: string;
  message?: string;
  style?: StyleProp<ViewStyle>;
}

export const LoadingState = ({
  title = 'Preparing AltasAI',
  message,
  style,
}: LoadingStateProps) => (
  <View accessibilityRole="progressbar" style={[styles.container, style]}>
    <ActivityIndicator size="large" color={ALTASAI_COLORS.accent.bright} />
    <Text style={styles.title}>{title}</Text>
    {message ? <Text style={styles.message}>{message}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ALTASAI_SPACING.xl,
    gap: ALTASAI_SPACING.sm,
    backgroundColor: ALTASAI_COLORS.background.primary,
  },
  title: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  message: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    textAlign: 'center',
  },
});
