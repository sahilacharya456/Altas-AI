import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { ScreenContainer, AppHeader } from '../../src/components/layout';
import { CommandCard, StatCard } from '../../src/components/cards';
import { GradientButton, SectionHeader } from '../../src/components/common';
import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY, ALTASAI_RADIUS } from '../../src/theme';
import { altasaiCardEntrance } from '../../src/utils/animations';

const DAILY_GOAL_MINUTES = 120;

export default function DigitalScreen() {
  const [screenMinutes, setScreenMinutes] = useState(0);
  const exceeded = screenMinutes > DAILY_GOAL_MINUTES;

  const increment = (amount: number) => setScreenMinutes((prev) => Math.max(0, prev + amount));

  return (
    <ScreenContainer>
      <Animated.View entering={altasaiCardEntrance(0)}>
        <AppHeader
          eyebrow="Digital Discipline"
          title="Screen time control"
          subtitle="Track and limit digital consumption. Every minute counts."
        />
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(1)}>
        <View style={styles.statsGrid}>
          <StatCard label="Screen time" value={`${screenMinutes}m`} helper="today" tone={exceeded ? 'danger' : 'info'} style={styles.statCard} />
          <StatCard label="Goal" value={`${DAILY_GOAL_MINUTES}m`} helper="daily limit" tone="neutral" style={styles.statCard} />
          <StatCard label="Remaining" value={`${Math.max(0, DAILY_GOAL_MINUTES - screenMinutes)}m`} helper="left" tone={exceeded ? 'danger' : 'success'} style={styles.statCard} />
        </View>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(2)}>
        <SectionHeader title="Log screen time" subtitle="Track how long you've been on the screen." />
        <CommandCard eyebrow="Quick log" title="Add screen time">
          <View style={styles.incrementRow}>
            {[15, 30, 60].map((mins) => (
              <Pressable
                key={mins}
                accessibilityRole="button"
                accessibilityLabel={`Add ${mins} minutes`}
                style={styles.incrementButton}
                onPress={() => increment(mins)}
              >
                <Text style={styles.incrementText}>+{mins}m</Text>
              </Pressable>
            ))}
          </View>
          <GradientButton
            title="Reset today"
            size="sm"
            variant="ghost"
            onPress={() => setScreenMinutes(0)}
          />
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(3)}>
        <SectionHeader title="Progress" subtitle={exceeded ? '⚠️ Daily limit exceeded' : 'Within limit'} />
        <CommandCard eyebrow="Usage bar" title={exceeded ? 'Limit exceeded — step away' : 'Digital discipline active'}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, (screenMinutes / DAILY_GOAL_MINUTES) * 100)}%` },
                exceeded && styles.progressFillDanger,
              ]}
            />
          </View>
          <Text style={styles.hint}>
            {exceeded
              ? 'Put the phone down. Your future self will thank you.'
              : 'You are in control of your digital consumption today.'}
          </Text>
        </CommandCard>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', gap: ALTASAI_SPACING.sm },
  statCard: { flex: 1 },
  incrementRow: { flexDirection: 'row', gap: ALTASAI_SPACING.sm, marginBottom: ALTASAI_SPACING.md },
  incrementButton: {
    flex: 1,
    paddingVertical: ALTASAI_SPACING.md,
    borderRadius: ALTASAI_RADIUS.md,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    alignItems: 'center',
  },
  incrementText: { color: ALTASAI_COLORS.text.primary, fontWeight: ALTASAI_TYPOGRAPHY.weight.bold, fontSize: ALTASAI_TYPOGRAPHY.size.base },
  progressTrack: { height: 10, borderRadius: ALTASAI_RADIUS.full, backgroundColor: ALTASAI_COLORS.surface.strong, overflow: 'hidden', marginBottom: ALTASAI_SPACING.sm },
  progressFill: { height: '100%', borderRadius: ALTASAI_RADIUS.full, backgroundColor: ALTASAI_COLORS.accent.bright },
  progressFillDanger: { backgroundColor: ALTASAI_COLORS.error.primary },
  hint: { color: ALTASAI_COLORS.text.tertiary, fontSize: ALTASAI_TYPOGRAPHY.size.sm, lineHeight: ALTASAI_TYPOGRAPHY.size.sm * 1.5 },
});
