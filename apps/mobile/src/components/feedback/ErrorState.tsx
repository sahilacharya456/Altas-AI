import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';
import { GradientButton } from '../common/GradientButton';
import { GlassCard } from '../ui/GlassCard';
import { formatUserFacingError } from '../../utils/errors';

interface ErrorStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ErrorState = ({
  title = 'Something needs attention',
  message = 'AltasAI could not complete this request.',
  actionLabel,
  onAction,
  style,
}: ErrorStateProps) => (
  <GlassCard style={style} padding="lg">
    <View style={styles.container} accessibilityRole="alert" accessibilityLiveRegion="assertive">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{formatUserFacingError(message)}</Text>
      {actionLabel && onAction ? (
        <GradientButton title={actionLabel} onPress={onAction} variant="danger" size="sm" />
      ) : null}
    </View>
  </GlassCard>
);

const styles = StyleSheet.create({
  container: {
    gap: ALTASAI_SPACING.sm,
  },
  title: {
    color: ALTASAI_COLORS.error.light,
    fontSize: ALTASAI_TYPOGRAPHY.size.lg,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
  },
  message: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
  },
});
