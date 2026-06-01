import type { BuiltFeatures, InternalAIResult } from '../core/types';

export const assessBurnoutRisk = (features: BuiltFeatures): InternalAIResult<'low' | 'medium' | 'high' | 'critical'> => {
  const score = Math.round(Math.max(0, Math.min(100,
    features.burnoutSignalScore * 0.75 +
    features.workloadScore * 0.2 +
    (features.healthHabitScore < 45 ? 15 : 0)
  )));
  const label = score >= 85 ? 'critical' : score >= 65 ? 'high' : score >= 35 ? 'medium' : 'low';
  return {
    label,
    score,
    confidence: Number(Math.min(0.92, 0.45 + score / 170).toFixed(2)),
    reasons: ['Wellbeing risk guidance only. This is not a medical diagnosis.'],
    evidence: [`stress=${features.reflectionStressScore}`, `workload=${features.workloadScore}`, `healthHabitScore=${features.healthHabitScore}`],
    recommendation: score >= 65 ? 'Reduce workload and choose a recovery-compatible execution plan.' : 'Maintain boundaries and keep work measurable.',
    nextAction: score >= 65 ? 'Defer non-essential tasks and complete one small priority.' : 'Run a normal focus block with a clear stopping point.',
  };
};
