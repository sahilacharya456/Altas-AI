import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { FocusSession } from '../../types/firestore';
import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';
import { CommandCard } from './CommandCard';
import { GradientButton } from '../common';

interface FocusSessionCardProps {
  session?: FocusSession | null;
  title?: string;
  onStart?: () => void;
  onComplete?: () => void;
}

export const FocusSessionCard = ({
  session,
  title = 'Focus session',
  onStart,
  onComplete,
}: FocusSessionCardProps) => (
  <CommandCard eyebrow="Focus mode" title={title}>
    <View style={styles.body}>
      <Text style={styles.time}>{session ? `${session.durationMinutes}m` : 'Ready'}</Text>
      <Text style={styles.copy}>
        {session
          ? `Status: ${session.status}. Quality ${session.quality ?? 'not rated'}.`
          : 'Enter one deliberate block. No extra modules, no context switching.'}
      </Text>
      <View style={styles.actions}>
        {onStart ? <GradientButton title="Start focus" size="sm" onPress={onStart} /> : null}
        {onComplete ? <GradientButton title="Complete" size="sm" variant="secondary" onPress={onComplete} /> : null}
      </View>
    </View>
  </CommandCard>
);

const styles = StyleSheet.create({
  body: {
    gap: ALTASAI_SPACING.sm,
  },
  time: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size['4xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
  },
  copy: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ALTASAI_SPACING.sm,
  },
});
