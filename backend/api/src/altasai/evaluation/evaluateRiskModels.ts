import samples from '../datasets/risk-samples.json';
import { buildFeatures } from '../feature-store/featureBuilder';
import { predictDeadlineRisk } from '../models/deadlineRiskRegression';
import { evaluateClassification, makeResult } from './metrics';
import type { SafeUserMemory } from '../../services/memory';

const materializeMemory = (raw: typeof samples[number]['memory']): SafeUserMemory => {
  const now = Date.now();
  return {
    profile: null,
    tasks: raw.tasks.map((task) => ({
      ...task,
      scheduledDate: new Date(now + Number(task.scheduledDateOffsetDays ?? 0) * 86_400_000),
    })),
    goals: raw.goals,
    reflections: raw.reflections,
    focusSessions: raw.focusSessions,
    expenses: [],
    healthLogs: [],
    digitalUsage: [],
    securityEvents: [],
    cortexRisk: null,
    behaviorEvents: [],
  };
};

export const evaluateRiskModels = () => {
  const expected = samples.map((sample) => sample.expectedDeadlineRisk);
  const actual = samples.map((sample) => predictDeadlineRisk(buildFeatures(materializeMemory(sample.memory))).label);
  const metrics = evaluateClassification(expected, actual);
  return makeResult('risk_models', metrics.accuracy, 0.75, metrics);
};
