import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';
import { GlassCard } from '../ui/GlassCard';
import { GradientButton } from '../common/GradientButton';
import { RiskBadge, RiskLevel } from '../feedback/RiskBadge';

interface InsightCardProps {
  title: string;
  body: string;
  eyebrow?: string;
  risk?: RiskLevel;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const InsightCard = ({
  title,
  body,
  eyebrow = 'AI insight',
  risk,
  actionLabel,
  onAction,
  style,
}: InsightCardProps) => (
  <GlassCard style={style} padding="lg">
    <View style={styles.header}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      {risk ? <RiskBadge level={risk} /> : null}
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.body}>{body}</Text>
    {actionLabel && onAction ? (
      <GradientButton
        title={actionLabel}
        onPress={onAction}
        variant="secondary"
        size="sm"
        style={styles.action}
      />
    ) : null}
  </GlassCard>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ALTASAI_SPACING.sm,
    marginBottom: ALTASAI_SPACING.sm,
  },
  eyebrow: {
    color: ALTASAI_COLORS.accent.bright,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    textTransform: 'uppercase',
  },
  title: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xl,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    letterSpacing: ALTASAI_TYPOGRAPHY.tracking.normal,
  },
  body: {
    marginTop: ALTASAI_SPACING.sm,
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    lineHeight: ALTASAI_TYPOGRAPHY.size.base * ALTASAI_TYPOGRAPHY.leading.normal,
  },
  action: {
    alignSelf: 'flex-start',
    marginTop: ALTASAI_SPACING.md,
  },
});
