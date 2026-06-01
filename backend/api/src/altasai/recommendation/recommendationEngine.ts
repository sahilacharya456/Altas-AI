import rules from '../datasets/intervention-rules.json';
import type { InterventionRecommendation, ProductivityPattern } from '../core/types';
import type { AltasAIOrchestrationResult } from '../core/orchestrator';

const priorityRank = { low: 1, medium: 2, high: 3, critical: 4 };

export const recommendInterventions = (
  patterns: ProductivityPattern[],
  orchestration?: Pick<AltasAIOrchestrationResult, 'deadlineRisk' | 'focusPrediction' | 'burnoutRisk' | 'rankedTasks' | 'userStateVector'>
): InterventionRecommendation[] => {
  const recommendations: InterventionRecommendation[] = [];

  for (const pattern of patterns) {
    const rule = rules.find((item) => item.pattern === pattern.label);
    if (!rule) continue;
    recommendations.push({
      id: rule.id,
      title: rule.title,
      action: rule.action,
      priority: rule.priority as InterventionRecommendation['priority'],
      confidence: Number(Math.min(0.96, pattern.confidence + 0.08).toFixed(2)),
      reason: pattern.reason,
      triggeredBy: pattern.signals,
      expectedBenefit: rule.expectedBenefit,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'prioritize_urgent_task',
      title: 'Choose the next visible action',
      action: 'Pick the highest-priority task and work for 10 minutes before reviewing anything else.',
      priority: 'medium',
      confidence: 0.62,
      reason: 'No strong risk pattern was detected, so the safest move is execution clarity.',
      triggeredBy: ['context.default_execution'],
      expectedBenefit: 'Creates momentum without adding complexity.',
    });
  }

  if (orchestration?.deadlineRisk.score && orchestration.deadlineRisk.score >= 65) {
    recommendations.push({
      id: 'deadline_risk_rescope',
      title: 'Rescope deadline risk',
      action: orchestration.deadlineRisk.nextAction,
      priority: orchestration.deadlineRisk.label === 'critical' ? 'critical' : 'high',
      confidence: orchestration.deadlineRisk.confidence,
      reason: orchestration.deadlineRisk.recommendation,
      triggeredBy: orchestration.deadlineRisk.evidence,
      expectedBenefit: 'Reduces missed-deadline probability by converting risk into a concrete action.',
    });
  }

  if (orchestration?.burnoutRisk.score && orchestration.burnoutRisk.score >= 65) {
    recommendations.push({
      id: 'reduce_overload_plan',
      title: 'Reduce overload before execution',
      action: orchestration.burnoutRisk.nextAction,
      priority: orchestration.burnoutRisk.label === 'critical' ? 'critical' : 'high',
      confidence: orchestration.burnoutRisk.confidence,
      reason: orchestration.burnoutRisk.recommendation,
      triggeredBy: orchestration.burnoutRisk.evidence,
      expectedBenefit: 'Keeps productivity guidance bounded and sustainable without making medical claims.',
    });
  }

  if (orchestration?.focusPrediction.label === 'ready' && orchestration.rankedTasks[0]) {
    recommendations.push({
      id: 'start_ranked_focus',
      title: 'Start the ranked focus block',
      action: `Start ${orchestration.focusPrediction.recommendedDuration} minutes on "${orchestration.rankedTasks[0].title}".`,
      priority: 'medium',
      confidence: orchestration.focusPrediction.confidence,
      reason: orchestration.focusPrediction.recommendation,
      triggeredBy: orchestration.focusPrediction.evidence,
      expectedBenefit: 'Uses readiness while it is available instead of extending planning.',
    });
  }

  return recommendations
    .sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority] || b.confidence - a.confidence)
    .slice(0, 3);
};
