import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ALTASAI_COLORS, ALTASAI_RADIUS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface RiskBadgeProps {
  level: RiskLevel;
  label?: string;
}

const riskConfig: Record<RiskLevel, { color: string; background: string; label: string }> = {
  low: { color: ALTASAI_COLORS.success.light, background: ALTASAI_COLORS.success.glow, label: 'Low risk' },
  medium: { color: ALTASAI_COLORS.warning.light, background: ALTASAI_COLORS.warning.glow, label: 'Medium risk' },
  high: { color: ALTASAI_COLORS.error.light, background: ALTASAI_COLORS.error.glow, label: 'High risk' },
  critical: { color: '#FCA5A5', background: 'rgba(239, 68, 68, 0.28)', label: 'Critical risk' },
};

export const RiskBadge = ({ level, label }: RiskBadgeProps) => {
  const config = riskConfig[level];

  return (
    <View
      accessibilityLabel={label ?? config.label}
      style={[styles.badge, { backgroundColor: config.background, borderColor: config.color }]}
    >
      <Text style={[styles.text, { color: config.color }]}>{label ?? config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: ALTASAI_RADIUS.full,
    paddingHorizontal: ALTASAI_SPACING.sm,
  },
  text: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
});
