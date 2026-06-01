import type { BuiltFeatures, InternalAIResult } from '../core/types';

export const scoreHabitConsistency = (features: BuiltFeatures): InternalAIResult<'weak' | 'building' | 'stable'> & { streaks: Record<string, number>; weakPoints: string[] } => {
  const score = Math.round(Math.max(0, Math.min(100, features.consistencyScore)));
  const weakPoints = [
    features.focusConsistency < 0.45 ? 'focus_streak' : null,
    features.reflectionCount < 3 ? 'reflection_streak' : null,
    features.taskCompletionRate < 0.45 ? 'task_completion' : null,
  ].filter(Boolean) as string[];
  return {
    label: score >= 70 ? 'stable' : score >= 45 ? 'building' : 'weak',
    score,
    confidence: 0.72,
    reasons: ['Consistency combines task completion, focus completion, reflection frequency, and carry debt.'],
    evidence: [`consistencyScore=${score}`, `weakPoints=${weakPoints.join(',') || 'none'}`],
    recommendation: weakPoints.length ? 'Stabilize one weak routine before adding new goals.' : 'Keep the current streak visible.',
    nextAction: weakPoints.includes('reflection_streak') ? 'Write a two-minute reflection today.' : 'Complete one scheduled task today.',
    streaks: {
      focus: Math.round(features.focusConsistency * 7),
      reflection: features.reflectionCount,
      execution: Math.round(features.taskCompletionRate * 7),
    },
    weakPoints,
  };
};
