import type { BuiltFeatures, InternalAIResult } from '../core/types';

export const assessBurnoutRisk = (features: BuiltFeatures): InternalAIResult<'low' | 'medium' | 'high' | 'critical'> => {
  // Health acts bidirectionally: poor health (< 45) adds pressure; good health (> 65) provides a buffer.
  // Previously only the penalty existed — good habits had zero effect on burnout risk.
  const healthModifier = features.healthHabitScore < 45
    ? 12
    : features.healthHabitScore > 65
    ? -8
    : 0;

  const score = Math.round(Math.max(0, Math.min(100,
    features.burnoutSignalScore * 0.75 +
    features.workloadScore * 0.20 +
    healthModifier
  )));

  const label = score >= 85 ? 'critical' : score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low';

  return {
    label,
    score,
    confidence: Number(Math.min(0.92, 0.45 + score / 170).toFixed(2)),
    reasons: ['Wellbeing risk guidance only. This is not a medical diagnosis.'],
    evidence: [
      `stress=${features.reflectionStressScore}`,
      `workload=${features.workloadScore}`,
      `healthHabitScore=${features.healthHabitScore}`,
    ],
    recommendation: score >= 65
      ? 'Reduce workload and choose a recovery-compatible execution plan.'
      : 'Maintain boundaries and keep work measurable.',
    nextAction: score >= 65
      ? 'Defer non-essential tasks and complete one small priority.'
      : 'Run a normal focus block with a clear stopping point.',
  };
};
