import type { BuiltFeatures, InternalAIResult, ProductivityState, UserStateVector } from '../core/types';

export const classifyProductivityState = (
  features: BuiltFeatures,
  vector: UserStateVector
): InternalAIResult<ProductivityState> => {
  const candidates: Array<InternalAIResult<ProductivityState>> = [
    {
      label: 'burned_out_risk',
      score: vector.burnoutRiskScore,
      confidence: vector.burnoutRiskScore / 100,
      reasons: ['Burnout risk combines stress, workload, inactivity, and reflection language.'],
      evidence: [`burnoutRiskScore=${vector.burnoutRiskScore}`, `stressSignal=${vector.stressSignal}`],
      recommendation: 'Reduce scope and choose one recovery-compatible task.',
      nextAction: 'Pick the smallest overdue task or take a short reset before planning.',
    },
    {
      label: 'overloaded',
      score: features.workloadScore,
      confidence: features.workloadScore / 100,
      reasons: ['Open tasks, critical tasks, and overdue tasks indicate workload pressure.'],
      evidence: [`openTasks=${features.openTasks}`, `overdueTasks=${features.overdueTasks}`, `criticalTasks=${features.criticalTasks}`],
      recommendation: 'Switch to top-three execution mode.',
      nextAction: 'Select three tasks max and defer or rescope the rest.',
    },
    {
      label: 'procrastinating',
      score: features.procrastinationScore,
      confidence: features.procrastinationScore / 100,
      reasons: ['Carry debt, overdue ratio, and avoidance language indicate procrastination.'],
      evidence: [`carriedTasks=${features.carriedTasks}`, `overdueTaskRatio=${features.overdueTaskRatio.toFixed(2)}`],
      recommendation: 'Break the oldest delayed task into a 10-minute start.',
      nextAction: 'Start a visible micro-task now.',
    },
    {
      label: 'high_momentum',
      score: vector.productivityScore,
      confidence: vector.productivityScore / 100,
      reasons: ['Task completion and focus consistency are strong enough for momentum.'],
      evidence: [`productivityScore=${vector.productivityScore}`, `focusScore=${vector.focusScore}`],
      recommendation: 'Protect momentum by finishing before adding work.',
      nextAction: 'Continue with the highest-ranked task.',
    },
    {
      label: 'planning_needed',
      score: 100 - vector.executionReadinessScore,
      confidence: (100 - vector.executionReadinessScore) / 100,
      reasons: ['Execution readiness is low or unclear.'],
      evidence: [`executionReadinessScore=${vector.executionReadinessScore}`],
      recommendation: 'Clarify the next action before starting.',
      nextAction: 'Write the next physical action in one sentence.',
    },
  ];

  const best = candidates.sort((a, b) => b.score - a.score)[0];
  if (best.score < 45) {
    return {
      label: features.completedTasks >= 3 ? 'consistent' : 'execution_needed',
      score: Math.max(vector.productivityScore, 45),
      confidence: 0.58,
      reasons: ['No severe risk state dominated the current signal set.'],
      evidence: [`completedTasks=${features.completedTasks}`, `openTasks=${features.openTasks}`],
      recommendation: 'Convert the current signal into one execution block.',
      nextAction: 'Start the highest-value task for 25 minutes.',
    };
  }
  return { ...best, confidence: Number(Math.min(0.95, Math.max(0.5, best.confidence)).toFixed(2)) };
};
