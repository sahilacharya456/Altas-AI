import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';
import type { Intervention } from '../../types/firestore';
import { GradientButton } from '../common/GradientButton';
import { RiskBadge } from '../feedback/RiskBadge';
import { CommandCard } from './CommandCard';

interface InterventionCardProps {
  intervention: Intervention;
  onAccept?: () => void;
  onIgnore?: () => void;
  onComplete?: () => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const InterventionCard = ({
  intervention,
  onAccept,
  onIgnore,
  onComplete,
  compact = false,
  style,
}: InterventionCardProps) => (
  <CommandCard
    eyebrow={`${intervention.type} intervention`}
    title={intervention.title}
    right={<RiskBadge level={intervention.severity} />}
    style={style}
    footer={
      <View style={styles.actions}>
        {onAccept ? <GradientButton title="Accept" size="sm" onPress={onAccept} /> : null}
        {onComplete ? <GradientButton title="Complete" size="sm" variant="secondary" onPress={onComplete} /> : null}
        {onIgnore ? <GradientButton title="Ignore" size="sm" variant="ghost" onPress={onIgnore} /> : null}
      </View>
    }
  >
    <Text numberOfLines={compact ? 2 : undefined} style={styles.reason}>{intervention.reason}</Text>
    <Text numberOfLines={compact ? 2 : undefined} style={styles.action}>{intervention.recommendedAction}</Text>
    {!compact && intervention.sourceSignals.length ? (
      <Text style={styles.signals}>Signals: {intervention.sourceSignals.join(', ')}</Text>
    ) : null}
  </CommandCard>
);

const styles = StyleSheet.create({
  reason: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
    marginBottom: ALTASAI_SPACING.sm,
  },
  action: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  signals: {
    marginTop: ALTASAI_SPACING.sm,
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ALTASAI_SPACING.sm,
  },
});
