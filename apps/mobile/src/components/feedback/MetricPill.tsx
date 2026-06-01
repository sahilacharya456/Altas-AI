import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ALTASAI_COLORS, ALTASAI_RADIUS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';

type MetricTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface MetricPillProps {
  label: string;
  value: string | number;
  tone?: MetricTone;
}

const toneColor: Record<MetricTone, string> = {
  neutral: ALTASAI_COLORS.text.secondary,
  success: ALTASAI_COLORS.success.light,
  warning: ALTASAI_COLORS.warning.light,
  danger: ALTASAI_COLORS.error.light,
  info: ALTASAI_COLORS.info.light,
};

export const MetricPill = ({ label, value, tone = 'neutral' }: MetricPillProps) => (
  <View style={styles.container}>
    <Text style={[styles.value, { color: toneColor[tone] }]}>{value}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ALTASAI_SPACING.xs,
    paddingHorizontal: ALTASAI_SPACING.md,
    borderRadius: ALTASAI_RADIUS.full,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
  },
  value: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
  },
  label: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
  },
});
