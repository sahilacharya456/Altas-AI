import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '../../../components/ui';
import { theme } from '../../../theme';
import type { AnalyticsDashboard, AnalyticsRange, AnalyticsWeeklyStats } from '../types';
import { styles } from './analyticsStyles';

interface AnalyticsStatsGridProps {
  dashboard: AnalyticsDashboard | null;
  range: AnalyticsRange;
  weeklyStats: AnalyticsWeeklyStats;
}

export function AnalyticsStatsGrid({ dashboard, range, weeklyStats }: AnalyticsStatsGridProps) {
  const stats = [
    {
      label: 'Productivity',
      value: dashboard?.scores.productivity ?? 50,
      subtext: 'Score',
      glow: theme.colors.success.glow,
    },
    {
      label: 'Consistency',
      value: dashboard?.scores.consistency ?? 50,
      subtext: 'Score',
      glow: theme.colors.accent.glow,
    },
    {
      label: 'Focus',
      value: `${Math.round(weeklyStats.totalFocus / 60)}h`,
      subtext: `Total this ${range.toLowerCase()}`,
      glow: theme.colors.warning.glow,
    },
    {
      label: 'Velocity',
      value: weeklyStats.totalTasks,
      subtext: 'Tasks completed',
      glow: theme.colors.primary.glow,
    },
  ];

  return (
    <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.statsGrid}>
      {stats.map((stat) => (
        <GlassCard key={stat.label} style={styles.statCard}>
          <View style={[styles.statGlow, { backgroundColor: stat.glow }]} />
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
          <Text style={styles.statSubtext}>{stat.subtext}</Text>
        </GlassCard>
      ))}
    </Animated.View>
  );
}
