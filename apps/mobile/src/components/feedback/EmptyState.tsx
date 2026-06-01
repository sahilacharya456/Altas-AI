import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';
import { GlassCard } from '../ui/GlassCard';
import { GradientButton } from '../common/GradientButton';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const EmptyState = ({
  title,
  message,
  actionLabel,
  onAction,
  icon,
  style,
}: EmptyStateProps) => (
  <GlassCard style={style} padding="lg">
    <View style={styles.container}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <GradientButton title={actionLabel} onPress={onAction} size="sm" variant="secondary" />
      ) : null}
    </View>
  </GlassCard>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: ALTASAI_SPACING.sm,
  },
  icon: {
    marginBottom: ALTASAI_SPACING.xs,
  },
  title: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.lg,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    textAlign: 'center',
  },
  message: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
    textAlign: 'center',
  },
});
