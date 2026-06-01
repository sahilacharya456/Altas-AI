export type ReflectionStep = 'intro' | 'mood' | 'energy' | 'wins' | 'challenges' | 'gratitude' | 'summary';

export interface DaySummary {
  tasksCompleted: number;
  totalTasks: number;
  focusMinutes: number;
  screenTime: number;
}

export interface ReflectionOption {
  value: number;
  emoji: string;
  label: string;
}
