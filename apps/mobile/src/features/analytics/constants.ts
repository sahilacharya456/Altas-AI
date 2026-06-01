import type { AnalyticsRange, AnalyticsWeeklyStats } from './types';

export const ANALYTICS_RANGES: AnalyticsRange[] = ['Week', 'Month'];

export const DEFAULT_WEEKLY_STATS: AnalyticsWeeklyStats = {
  totalTasks: 0,
  totalFocus: 0,
  scores: [50, 50, 50, 50, 50, 50, 50],
  dates: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};
