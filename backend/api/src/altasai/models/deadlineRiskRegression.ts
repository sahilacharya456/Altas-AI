import type { BuiltFeatures, InternalAIResult } from '../core/types';

export type DeadlineRiskLevel = 'low' | 'medium' | 'high' | 'critical';

const levelFor = (score: number): DeadlineRiskLevel =>
  score >= 85 ? 'critical' : score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low';

export const predictDeadlineRisk = (features: BuiltFeatures): InternalAIResult<DeadlineRiskLevel> => {
  const carryRatio = Math.min(1, features.carriedTasks / 5);
  const criticalRatio = Math.min(1, features.criticalTasks / 4);

  const baseScore =
    features.overdueTaskRatio * 42 +
    carryRatio * 25 +
    criticalRatio * 15 +
    features.procrastinationScore * 0.08 +
    features.workloadScore * 0.06 +
    (100 - features.consistencyScore) * 0.07;

  // Escalation: overdue critical tasks with carry debt signal imminent failure
  const hasOverdueCritical = features.overdueTasks > 0 && features.criticalTasks > 0;
  const escalation = hasOverdueCritical ? 40 + carryRatio * 20 : 0;

  const score = Math.round(Math.max(0, Math.min(100, baseScore + escalation)));

  return {
    label: levelFor(score),
    score,
    confidence: Number(Math.min(0.93, 0.45 + score / 180).toFixed(2)),
    reasons: ['Score from overdue ratio, carry debt, critical ratio, procrastination, workload, consistency, and overdue-critical escalation.'],
    evidence: [
      `overdueTaskRatio=${features.overdueTaskRatio.toFixed(2)}`,
      `carryRatio=${carryRatio.toFixed(2)}`,
      `criticalRatio=${criticalRatio.toFixed(2)}`,
      `escalation=${escalation.toFixed(0)}`,
    ],
    recommendation: score >= 65
      ? 'Rescope deadlines and execute the oldest risky task first.'
      : 'Keep deadlines visible and protect one focus block.',
    nextAction: score >= 65
      ? 'Move or break the highest-risk task today.'
      : 'Schedule one deadline-focused work block.',
  };
};
