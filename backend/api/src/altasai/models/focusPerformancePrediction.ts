import type { BuiltFeatures, InternalAIResult, RankedTask } from '../core/types';

export const predictFocusPerformance = (
  features: BuiltFeatures,
  rankedTasks: RankedTask[],
  now = new Date()
): InternalAIResult<'ready' | 'fragile' | 'not_ready'> & { recommendedDuration: number; suggestedTask?: string; distractionRisk: number } => {
  const hour = now.getHours();
  const timeBonus = hour >= 8 && hour <= 12 ? 12 : hour >= 14 && hour <= 18 ? 6 : -6;
  const readiness = Math.round(Math.max(0, Math.min(100,
    45 + features.focusConsistency * 25 + timeBonus + features.executionScore * 0.25 - features.burnoutSignalScore * 0.25 - features.procrastinationScore * 0.15
  )));
  const distractionRisk = Math.round(Math.max(0, Math.min(100, 100 - readiness + features.procrastinationScore * 0.25)));
  const label = readiness >= 70 ? 'ready' : readiness >= 45 ? 'fragile' : 'not_ready';
  const recommendedDuration = readiness >= 70 ? 45 : readiness >= 45 ? 25 : 10;

  return {
    label,
    score: readiness,
    confidence: Number(Math.min(0.9, 0.45 + Math.abs(readiness - 50) / 100).toFixed(2)),
    reasons: ['Focus readiness uses time of day, focus consistency, execution score, burnout signal, and procrastination signal.'],
    evidence: [`focusConsistency=${features.focusConsistency.toFixed(2)}`, `hour=${hour}`, `distractionRisk=${distractionRisk}`],
    recommendation: label === 'not_ready' ? 'Use a 10-minute starter block, not a long session.' : 'Start a focused block on the top-ranked task.',
    nextAction: rankedTasks[0]?.nextAction ?? 'Choose one clear task before starting focus.',
    recommendedDuration,
    suggestedTask: rankedTasks[0]?.title,
    distractionRisk,
  };
};
