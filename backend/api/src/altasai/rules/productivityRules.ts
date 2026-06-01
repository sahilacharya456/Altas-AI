export const productivityRules = [
  {
    id: 'open_tasks_overload',
    condition: 'openTasks >= 7',
    label: 'overloaded',
    recommendation: 'Use top-three execution mode and defer non-essential work.',
  },
  {
    id: 'carry_debt',
    condition: 'carriedTasks > 0',
    label: 'procrastinating',
    recommendation: 'Break the oldest carried task into a 10-minute action.',
  },
  {
    id: 'deadline_pressure',
    condition: 'overdueTaskRatio >= 0.35',
    label: 'deadline_risk',
    recommendation: 'Rescope overdue work before adding new tasks.',
  },
] as const;
