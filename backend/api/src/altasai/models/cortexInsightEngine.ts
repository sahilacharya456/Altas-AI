import type { CortexInsight, InternalAIResult, UserStateVector } from '../core/types';

export const generateCortexInsight = (
  vector: UserStateVector,
  models: Array<InternalAIResult<string>>
): CortexInsight => {
  const topRiskModel = [...models].sort((a, b) => b.score - a.score)[0];
  const topRisk = topRiskModel
    ? `${topRiskModel.label}: ${topRiskModel.recommendation}`
    : 'No dominant risk detected.';

  // Derive opportunity from actual vector state rather than a single hardcoded string.
  const topOpportunity = (() => {
    if (vector.executionReadinessScore >= 70 && vector.burnoutRiskScore < 40) {
      return 'Execution readiness is strong — start a focused block now before the window closes.';
    }
    if (vector.goalProgressScore >= 60) {
      return 'Goal momentum is active. One focused session can compound existing progress.';
    }
    if (vector.consistencyScore >= 65) {
      return 'Consistency is your current edge. Protect it by keeping today\'s task count small.';
    }
    if (vector.burnoutRiskScore >= 65) {
      return 'Recovery is the highest-value action right now. One completed task beats three started ones.';
    }
    return 'Planning clarity is the unlock. Choose one task, commit to it, and start within 5 minutes.';
  })();

  const bestNextAction = topRiskModel?.nextAction ?? 'Start the highest-value task for 25 minutes.';

  const topInsight = vector.productivityScore >= 65
    ? 'Momentum is usable if work stays constrained.'
    : 'The system needs one clean execution win.';

  return {
    topInsight,
    topRisk,
    topOpportunity,
    bestNextAction,
    explanation: `Cortex combined productivity=${vector.productivityScore}, workload=${vector.workloadScore}, burnout=${vector.burnoutRiskScore}, readiness=${vector.executionReadinessScore}.`,
    confidence: Number(Math.min(0.92, 0.55 + Math.abs(vector.executionReadinessScore - 50) / 120).toFixed(2)),
  };
};
