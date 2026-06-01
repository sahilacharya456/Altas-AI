import type { BuiltFeatures, InternalAIResult } from '../core/types';

export type DeadlineRiskLevel = 'low' | 'medium' | 'high' | 'critical';

const levelFor = (score: number): DeadlineRiskLevel =>
  score >= 85 ? 'critical' : score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low';

export const predictDeadlineRisk = (features: BuiltFeatures): InternalAIResult<DeadlineRiskLevel> => {
  // Normalize carry debt and critical tasks to ratios (capped) so raw counts
  // cannot dominate. Previously carriedTasks * 14 would score 98 at 7 tasks alone.
  const carryRatio = Math.min(1, features.carriedTasks / 5);
  const criticalRatio = Math.min(1, features.criticalTasks / 4);

  const score = Math.round(Math.max(0, Math.min(100,
    features.overdueTaskRatio * 45 +
    carryRatio * 25 +
    criticalRatio * 15 +
    features.procrastinationScore * 0.08 +
    features.workloadScore * 0.05 +
    (100 - features.consistencyScore) * 0.07
  )));

  return {
    label: levelFor(score),
    score,
    confidence: Number(Math.min(0.93, 0.45 + score / 180).toFixed(2)),
    reasons: ['Score from overdue ratio (45%), carry debt ratio (25%), critical task ratio (15%), procrastination, workload, and consistency.'],
    evidence: [
      `overdueTaskRatio=${features.overdueTaskRatio.toFixed(2)}`,
      `carryRatio=${carryRatio.toFixed(2)}`,
      `criticalRatio=${criticalRatio.toFixed(2)}`,
    ],
    recommendation: score >= 65
      ? 'Rescope deadlines and execute the oldest risky task first.'
      : 'Keep deadlines visible and protect one focus block.',
    nextAction: score >= 65
      ? 'Move or break the highest-risk task today.'
      : 'Schedule one deadline-focused work block.',
  };
};
