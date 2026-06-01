import type { CortexInsight, InternalAIResult, UserStateVector } from '../core/types';

export const generateCortexInsight = (
  vector: UserStateVector,
  models: Array<InternalAIResult<string>>
): CortexInsight => {
  const topRiskModel = models.sort((a, b) => b.score - a.score)[0];
  const topRisk = topRiskModel ? `${topRiskModel.label}: ${topRiskModel.recommendation}` : 'No dominant risk detected.';
  const topOpportunity = vector.executionReadinessScore >= 65
    ? 'Execution readiness is strong enough for a focused work block.'
    : 'Planning clarity can unlock execution readiness.';
  const bestNextAction = topRiskModel?.nextAction ?? 'Start the highest-value task for 25 minutes.';
  return {
    topInsight: vector.productivityScore >= 65 ? 'Momentum is usable if work stays constrained.' : 'The system needs one clean execution win.',
    topRisk,
    topOpportunity,
    bestNextAction,
    explanation: `Cortex combined productivity=${vector.productivityScore}, workload=${vector.workloadScore}, burnout=${vector.burnoutRiskScore}, readiness=${vector.executionReadinessScore}.`,
    confidence: Number(Math.min(0.92, 0.55 + Math.abs(vector.executionReadinessScore - 50) / 120).toFixed(2)),
  };
};
