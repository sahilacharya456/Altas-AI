import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AnimatedProgressRing, GlassCard } from '../../../components/ui';
import { theme } from '../../../theme';
import type { AnalyticsDashboard, AnalyticsWeeklyStats } from '../types';
import { styles } from './analyticsStyles';

interface AnalyticsScoreCardProps {
  dashboard: AnalyticsDashboard | null;
  disciplineScore: number;
  weeklyStats: AnalyticsWeeklyStats;
}

export function AnalyticsScoreCard({
  dashboard,
  disciplineScore,
  weeklyStats,
}: AnalyticsScoreCardProps) {
  const trendLabel =
    dashboard?.week.trend === 'up'
      ? 'Trending Up'
      : dashboard?.week.trend === 'down'
        ? 'Needs Focus'
        : 'Stable';

  const verdict =
    disciplineScore >= 80
      ? 'Excellent discipline. Keep pushing.'
      : disciplineScore >= 60
        ? 'Decent progress. Room for improvement.'
        : 'Below expectations. Time to refocus.';

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(600)}>
      <GlassCard glow glowColor={theme.colors.primary.glow} style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreLabel}>DISCIPLINE SCORE</Text>
          <View style={styles.changeBadge}>
            <Text style={styles.changeText}>{trendLabel}</Text>
          </View>
        </View>

        <View style={styles.scoreContent}>
          <AnimatedProgressRing
            progress={disciplineScore / 100}
            size={140}
            strokeWidth={12}
            showPercentage
            gradientColors={[theme.colors.primary.light, theme.colors.accent.DEFAULT]}
          />

          <View style={styles.scoreInsights}>
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>{weeklyStats.totalTasks}</Text>
              <Text style={styles.insightLabel}>Tasks Done</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>{dashboard?.streakDays ?? 0}</Text>
              <Text style={styles.insightLabel}>Day Streak</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>{Math.round(weeklyStats.totalFocus / 60)}h</Text>
              <Text style={styles.insightLabel}>Focus Time</Text>
            </View>
          </View>
        </View>

        <View style={styles.scoreVerdict}>
          <Text style={styles.verdictText}>{verdict}</Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}
