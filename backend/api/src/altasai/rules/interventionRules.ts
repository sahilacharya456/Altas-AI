export const interventionRules = [
  {
    id: 'start_25_min_focus',
    trigger: 'focusReadinessScore >= 70',
    action: 'Start a 25-minute focus block on the highest-ranked task.',
  },
  {
    id: 'break_task_down',
    trigger: 'procrastinationScore >= 50',
    action: 'Break the task into the smallest visible step.',
  },
  {
    id: 'reduce_workload',
    trigger: 'burnoutRiskScore >= 65',
    action: 'Reduce workload and choose one recovery-compatible task.',
  },
] as const;
