import { generateReportInsight } from '../pipelines/reportInsightGenerator';
import type { SafeUserMemory } from '../../services/memory';
import { average, makeResult } from './metrics';

const memories: SafeUserMemory[] = [
  {
    profile: null,
    tasks: [{ title: 'Ship build', status: 'completed' }, { title: 'Fix tests', status: 'pending', priority: 'high', scheduledDate: new Date() }],
    goals: [{ title: 'Portfolio launch', status: 'active', progress: 50 }],
    reflections: [{ honestAssessment: 'I completed one task but still have risk.' }],
    focusSessions: [{ durationMinutes: 25, status: 'completed' }],
    expenses: [],
    healthLogs: [],
    digitalUsage: [],
    securityEvents: [],
    cortexRisk: null,
    behaviorEvents: [],
  },
];

export const evaluateReports = () => {
  const requiredFields = ['productivityScore', 'focusScore', 'consistencyScore', 'goalProgressScore', 'strongestPattern', 'biggestBlocker', 'bestNextAction', 'summary'];
  const scores = memories.map((memory) => {
    const report = generateReportInsight(memory) as unknown as Record<string, unknown>;
    const present = requiredFields.filter((field) => report[field] !== undefined && report[field] !== null && String(report[field]).length > 0);
    return present.length / requiredFields.length;
  });
  return makeResult('report_completeness', average(scores), 0.85, {
    requiredFields,
    cases: memories.length,
  });
};
