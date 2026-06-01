import type { SharedValue } from 'react-native-reanimated';

export type AnalyticsRange = 'Week' | 'Month';
export type AnalyticsTrend = 'up' | 'down' | 'stable';

export interface AnalyticsDashboard {
  today: {
    tasksCompleted: number;
    tasksPending: number;
    focusMinutes: number;
    completionRate: number;
  };
  week: {
    avgTasksCompleted: number;
    avgFocusMinutes: number;
    trend: AnalyticsTrend;
  };
  scores: {
    discipline: number;
    productivity: number;
    consistency: number;
  };
  streakDays: number;
}

export interface AnalyticsWeeklyStats {
  totalTasks: number;
  totalFocus: number;
  scores: number[];
  dates: string[];
}

export interface TrendChartProps {
  data: number[];
  progress: SharedValue<number>;
}
