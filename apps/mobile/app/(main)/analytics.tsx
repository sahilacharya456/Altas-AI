import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { ScreenContainer, AppHeader } from '../../src/components/layout';
import { CommandCard, StatCard } from '../../src/components/cards';
import { SectionHeader } from '../../src/components/common';
import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../src/theme';
import { altasaiCardEntrance } from '../../src/utils/animations';
import { useAuthStore } from '../../src/stores/authStore';

export default function AnalyticsScreen() {
  const { profile } = useAuthStore();
  const scores = profile?.currentScores ?? { discipline: 0, productivity: 0, consistency: 0 };

  return (
    <ScreenContainer>
      <Animated.View entering={altasaiCardEntrance(0)}>
        <AppHeader
          eyebrow="Intelligence"
          title="Behavioral analytics"
          subtitle="Your discipline, productivity, and consistency signals."
        />
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(1)}>
        <View style={styles.statsGrid}>
          <StatCard label="Discipline" value={scores.discipline} helper="/100" tone="info" style={styles.statCard} />
          <StatCard label="Productivity" value={scores.productivity} helper="/100" tone="warning" style={styles.statCard} />
          <StatCard label="Consistency" value={scores.consistency} helper="/100" tone="success" style={styles.statCard} />
        </View>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(2)}>
        <SectionHeader title="Performance overview" subtitle="Aggregated from all modules." />
        <CommandCard eyebrow="Cortex signal" title="Behavioral intelligence">
          <Text style={styles.body}>
            AltasAI tracks discipline through task completion rate, goal progress, health consistency, and focus session data. These feed the Cortex engine for proactive interventions.
          </Text>
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(3)}>
        <SectionHeader title="Coming soon" subtitle="Advanced charts and trend analysis." />
        <CommandCard eyebrow="In development" title="Weekly trend charts">
          <Text style={styles.body}>
            Discipline trend lines, task completion heatmaps, and behavioral pattern analysis are being built. Check back in the next update.
          </Text>
        </CommandCard>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', gap: ALTASAI_SPACING.sm },
  statCard: { flex: 1 },
  body: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * 1.6,
  },
});
