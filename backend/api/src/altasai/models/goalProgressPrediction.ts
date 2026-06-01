import type { BuiltFeatures, InternalAIResult } from '../core/types';

export const predictGoalProgress = (features: BuiltFeatures): InternalAIResult<'on_track' | 'watch' | 'at_risk'> & { progressScore: number; nextMilestone: string } => {
  const progressScore = Math.round(Math.max(0, Math.min(100,
    features.averageGoalProgress * 0.65 + features.executionScore * 0.25 + features.focusConsistency * 10 - features.procrastinationScore * 0.15
  )));
  const label = progressScore >= 70 ? 'on_track' : progressScore >= 40 ? 'watch' : 'at_risk';
  return {
    label,
    score: progressScore,
    progressScore,
    confidence: Number(Math.min(0.9, 0.5 + features.goalCount / 20).toFixed(2)),
    reasons: ['Goal forecast uses current goal progress, execution, focus consistency, and delay signals.'],
    evidence: [`averageGoalProgress=${features.averageGoalProgress.toFixed(1)}`, `goalCount=${features.goalCount}`],
    recommendation: label === 'at_risk' ? 'Create one milestone task tied to the goal.' : 'Continue with the next measurable milestone.',
    nextAction: 'Convert the goal into the next scheduled task.',
    nextMilestone: 'Define and schedule the next visible milestone.',
  };
};
