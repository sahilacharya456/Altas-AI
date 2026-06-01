import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { ALTASAI_COLORS, ALTASAI_RADIUS, ALTASAI_SHADOWS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';
import { GlassCard } from '../ui/GlassCard';

type StatTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
  trend?: string;
  tone?: StatTone;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const toneColor: Record<StatTone, string> = {
  neutral: ALTASAI_COLORS.text.secondary,
  success: ALTASAI_COLORS.success.light,
  warning: ALTASAI_COLORS.warning.light,
  danger: ALTASAI_COLORS.error.light,
  info: ALTASAI_COLORS.info.light,
};

export const StatCard = ({
  label,
  value,
  helper,
  trend,
  tone = 'neutral',
  icon,
  style,
}: StatCardProps) => (
  <GlassCard style={[styles.card, style]} padding="md">
    <View style={styles.header}>
      <Text numberOfLines={1} style={styles.label}>{label}</Text>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
    </View>
    <Text adjustsFontSizeToFit numberOfLines={1} style={styles.value}>
      {value}
    </Text>
    <View style={styles.footer}>
      {trend ? <Text style={[styles.trend, { color: toneColor[tone] }]}>{trend}</Text> : null}
      {helper ? <Text numberOfLines={1} style={styles.helper}>{helper}</Text> : null}
    </View>
  </GlassCard>
);

const styles = StyleSheet.create({
  card: {
    minHeight: 112,
    ...ALTASAI_SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ALTASAI_SPACING.sm,
  },
  label: {
    flex: 1,
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
  },
  icon: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ALTASAI_RADIUS.full,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
  },
  value: {
    marginTop: ALTASAI_SPACING.sm,
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size['2xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    letterSpacing: ALTASAI_TYPOGRAPHY.tracking.normal,
  },
  footer: {
    marginTop: ALTASAI_SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ALTASAI_SPACING.xs,
  },
  trend: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  helper: {
    flex: 1,
    color: ALTASAI_COLORS.text.muted,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
  },
});
