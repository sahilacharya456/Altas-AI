import samples from '../datasets/recommendation-samples.json';
import { runAltasAIOrchestrator } from '../core/orchestrator';
import { buildMentorPlan } from '../pipelines/mentorPlanner';
import type { SafeUserMemory } from '../../services/memory';
import { makeResult, topKAccuracy } from './metrics';

const memory: SafeUserMemory = {
  profile: null,
  tasks: [
    { title: 'Finish portfolio case study', status: 'pending', priority: 'critical', scheduledDate: new Date(Date.now() - 86_400_000), isCarried: true, carryCount: 1 },
    { title: 'Clean repo', status: 'pending', priority: 'high', scheduledDate: new Date() },
  ],
  goals: [{ title: 'Launch AltasAI', status: 'active', progress: 20 }],
  reflections: [],
  focusSessions: [],
  expenses: [],
  healthLogs: [],
  digitalUsage: [],
  securityEvents: [],
  cortexRisk: null,
  behaviorEvents: [],
};

export const evaluateRecommendations = () => {
  const predictions = samples.map((sample) =>
    buildMentorPlan(
      { userId: 'eval', message: sample.input, memory },
      runAltasAIOrchestrator({ userId: 'eval', message: sample.input, memory })
    ).recommendations.map((item) => item.id)
  );
  const expected = samples.map((sample) => sample.expectedTop3[0]);
  const top1 = topKAccuracy(expected, predictions, 1);
  const top3 = samples.reduce((count, sample, index) => {
    const predicted = new Set(predictions[index]?.slice(0, 3) ?? []);
    return count + (sample.expectedTop3.some((id) => predicted.has(id)) ? 1 : 0);
  }, 0) / Math.max(1, samples.length);
  return makeResult('recommendation_ranking', top3, 0.8, {
    top1Accuracy: top1,
    top3AcceptableAccuracy: Number(top3.toFixed(4)),
    predictions,
  });
};
