import type { BuiltFeatures, InternalAIResult } from '../core/types';

export type DeadlineRiskLevel = 'low' | 'medium' | 'high' | 'critical';

const levelFor = (score: number): DeadlineRiskLevel => score >= 85 ? 'critical' : score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low';

export const predictDeadlineRisk = (features: BuiltFeatures): InternalAIResult<DeadlineRiskLevel> => {
  const score = Math.round(Math.max(0, Math.min(100,
    features.overdueTaskRatio * 55 +
    features.carriedTasks * 14 +
    features.criticalTasks * 12 +
    features.procrastinationScore * 0.35 +
    features.workloadScore * 0.12 +
    (100 - features.consistencyScore) * 0.18
  )));
  return {
    label: levelFor(score),
    score,
    confidence: Number(Math.min(0.93, 0.45 + score / 180).toFixed(2)),
    reasons: ['Regression-style score from overdue ratio, carry debt, critical workload, procrastination, and consistency.'],
    evidence: [`overdueTaskRatio=${features.overdueTaskRatio.toFixed(2)}`, `carriedTasks=${features.carriedTasks}`, `criticalTasks=${features.criticalTasks}`],
    recommendation: score >= 65 ? 'Rescope deadlines and execute the oldest risky task first.' : 'Keep deadlines visible and protect one focus block.',
    nextAction: score >= 65 ? 'Move or break the highest-risk task today.' : 'Schedule one deadline-focused work block.',
  };
};
