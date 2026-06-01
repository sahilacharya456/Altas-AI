export const DISCIPLINE_LEVELS = {
  mentor: {
    id: 'mentor',
    name: 'Mentor',
    description: 'Supportive but firm guidance. You get encouragement with your accountability.',
    color: '#22D3EE',
    icon: 'MN',
  },
  strict: {
    id: 'strict',
    name: 'Strict Coach',
    description: 'No-nonsense accountability. Excuses are challenged. Results are expected.',
    color: '#F59E0B',
    icon: 'SC',
    recommended: true,
  },
  ruthless: {
    id: 'ruthless',
    name: 'Ruthless',
    description: 'Maximum accountability. Direct review, minimal comfort, clear execution demands.',
    color: '#EF4444',
    icon: 'RT',
  },
} as const;

export type DisciplineLevel = keyof typeof DISCIPLINE_LEVELS;

export const FOCUS_AREAS = {
  career: {
    id: 'career',
    name: 'Career',
    description: 'Job hunting, skill building, professional growth',
    icon: 'CR',
  },
  health: {
    id: 'health',
    name: 'Health',
    description: 'Diet, nutrition, general wellness',
    icon: 'HL',
  },
  fitness: {
    id: 'fitness',
    name: 'Fitness',
    description: 'Exercise, workouts, physical training',
    icon: 'FT',
  },
  study: {
    id: 'study',
    name: 'Study',
    description: 'Education, learning, exams',
    icon: 'SD',
  },
  personal: {
    id: 'personal',
    name: 'Personal Growth',
    description: 'Habits, mindset, self-improvement',
    icon: 'PG',
  },
} as const;

export type FocusArea = keyof typeof FOCUS_AREAS;

export const REMINDER_FREQUENCIES = {
  low: {
    id: 'low',
    name: 'Low',
    description: 'Essential reminders only',
    dailyReminders: 2,
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    description: 'Regular check-ins throughout the day',
    dailyReminders: 5,
  },
  high: {
    id: 'high',
    name: 'High',
    description: 'Frequent accountability prompts',
    dailyReminders: 10,
  },
} as const;

export type ReminderFrequency = keyof typeof REMINDER_FREQUENCIES;
