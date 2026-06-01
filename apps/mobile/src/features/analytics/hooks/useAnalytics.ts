import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Easing,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useAnalyticsStore } from '../../../stores/analyticsStore';
import { ANALYTICS_RANGES, DEFAULT_WEEKLY_STATS } from '../constants';
import type { AnalyticsDashboard, AnalyticsRange } from '../types';

export function useAnalytics() {
  const [selectedRange, setSelectedRange] = useState<AnalyticsRange>('Week');
  const {
    dashboard,
    chartData,
    isLoading,
    error,
    loadDashboard,
    loadChartData,
    clearError,
  } = useAnalyticsStore();
  const chartProgress = useSharedValue(0);

  const loadRange = useCallback(async () => {
    const days = selectedRange === 'Week' ? 7 : 30;
    chartProgress.value = 0;
    await Promise.all([loadDashboard(), loadChartData(days)]);
  }, [chartProgress, loadChartData, loadDashboard, selectedRange]);

  useEffect(() => {
    void loadRange();
  }, [loadRange]);

  useEffect(() => {
    chartProgress.value = withDelay(
      250,
      withTiming(1, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [chartData, chartProgress]);

  const weeklyStats = useMemo(() => {
    if (!chartData) return DEFAULT_WEEKLY_STATS;

    return {
      totalTasks: chartData.tasksCompleted.reduce((total, value) => total + value, 0),
      totalFocus: chartData.focusMinutes.reduce((total, value) => total + value, 0),
      scores: chartData.disciplineScores.length
        ? chartData.disciplineScores
        : DEFAULT_WEEKLY_STATS.scores,
      dates: chartData.dates.length ? chartData.dates : DEFAULT_WEEKLY_STATS.dates,
    };
  }, [chartData]);

  const insights = useMemo(() => {
    if (!dashboard) return ['AltasAI needs more activity data before it can build a reliable trend.'];

    const currentDashboard = dashboard as AnalyticsDashboard;
    const items: string[] = [];

    if (currentDashboard.scores.productivity > 75) {
      items.push('Your productivity is peaking. Schedule the hardest work while momentum is high.');
    } else if (currentDashboard.scores.productivity < 40) {
      items.push('Focus time is low. Start a short session before adding more tasks.');
    }

    if (currentDashboard.streakDays > 3) {
      items.push(`Strong streak of ${currentDashboard.streakDays} days. Protect the routine.`);
    } else if (currentDashboard.streakDays === 0) {
      items.push('No active streak yet. Complete one reflection tonight to restart the loop.');
    }

    if (currentDashboard.scores.discipline < 60) {
      items.push('Discipline score is below target. Review carried tasks and remove vague commitments.');
    }

    if (items.length === 0) {
      items.push('Consistency is stable. Keep logging progress so Cortex can detect sharper patterns.');
    }

    return items;
  }, [dashboard]);

  const retry = useCallback(() => {
    clearError();
    void loadRange();
  }, [clearError, loadRange]);

  return {
    selectedRange,
    setSelectedRange,
    ranges: ANALYTICS_RANGES,
    dashboard: dashboard as AnalyticsDashboard | null,
    weeklyStats,
    insights,
    disciplineScore: dashboard?.scores.discipline ?? 50,
    chartProgress,
    isLoading,
    error,
    retry,
  };
}
