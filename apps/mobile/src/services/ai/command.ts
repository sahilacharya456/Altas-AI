import { getErrorMessage } from '../../utils/errors';
import { callBackend } from './backendClient';

export interface DailyBriefing {
  topPriority: string;
  executionRisk: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  suggestedAction: string;
  avoidToday: string[];
}

const fallbackBriefing: DailyBriefing = {
  topPriority: 'Choose one task and execute it first.',
  executionRisk: 35,
  riskLevel: 'medium',
  reason: 'AI briefing is unavailable, so AltasAI is using deterministic fallback guidance.',
  suggestedAction: 'Start a 10 minute focus block on the highest-priority task.',
  avoidToday: ['Adding new work before completing one existing task'],
};

export const generateDailyBriefing = async (input?: string): Promise<DailyBriefing> => {
  try {
    const result = await callBackend<{ output: DailyBriefing }>('/api/daily-briefing', { input });
    return result.output;
  } catch (error) {
    if (__DEV__) console.warn('[AI] Daily briefing unavailable:', getErrorMessage(error));
    return fallbackBriefing;
  }
};
