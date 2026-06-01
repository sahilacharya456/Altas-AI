import { getErrorMessage } from '../../utils/errors';
import type { AltasAIReport } from '../../types/firestore';
import { callBackend } from './backendClient';

export interface WeeklyReport {
  summary: string;
  wins: string[];
  risks: string[];
  nextWeekActions: string[];
}

const fallbackReport: WeeklyReport = {
  summary: 'Weekly AI report is unavailable. AltasAI is using fallback guidance.',
  wins: ['Execution data was captured'],
  risks: ['Not enough AI analysis available'],
  nextWeekActions: ['Keep tasks small', 'Complete reflections', 'Protect focus sessions'],
};

export const generateWeeklyReport = async (input?: string): Promise<WeeklyReport> => {
  try {
    const result = await callBackend<{ output: WeeklyReport }>('/api/weekly-report', { input });
    return result.output;
  } catch (error) {
    if (__DEV__) console.warn('[AI] Weekly report unavailable:', getErrorMessage(error));
    return fallbackReport;
  }
};

// Stub — returns null until server-side scheduled report generation is implemented.
export const generateDailyReport = async (): Promise<AltasAIReport | null> => null;

// Stub — returns null until server-side stored report endpoint is implemented.
export const generateStoredWeeklyReport = async (_input?: string): Promise<AltasAIReport | null> => null;

// Stub — monthly reports are a P2 feature.
export const generateMonthlyReportPlaceholder = async (): Promise<AltasAIReport | null> => null;
