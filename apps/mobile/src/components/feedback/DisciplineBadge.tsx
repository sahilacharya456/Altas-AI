import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ALTASAI_COLORS, ALTASAI_RADIUS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';

export type DisciplineMode = 'calm' | 'firm' | 'strict';

interface DisciplineBadgeProps {
  mode: DisciplineMode;
  label?: string;
}

const modeConfig: Record<DisciplineMode, { color: string; background: string; label: string }> = {
  calm: { color: ALTASAI_COLORS.accent.bright, background: ALTASAI_COLORS.accent.glow, label: 'Calm' },
  firm: { color: ALTASAI_COLORS.warning.light, background: ALTASAI_COLORS.warning.glow, label: 'Firm' },
  strict: { color: ALTASAI_COLORS.discipline.bright, background: 'rgba(225, 29, 72, 0.16)', label: 'Strict' },
};

export const DisciplineBadge = ({ mode, label }: DisciplineBadgeProps) => {
  const config = modeConfig[mode];

  return (
    <View style={[styles.badge, { backgroundColor: config.background, borderColor: config.color }]}>
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
