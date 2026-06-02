import { Timestamp } from 'firebase/firestore';
import { getErrorMessage } from '../../utils/errors';
import type { AltasAIReport, ReportMetrics, ReportChartPoint } from '../../types/firestore';
import { addDocument } from '../firebase';
import { callBackend } from './backendClient';

export interface WeeklyReport {
  summary: string;
  wins: string[];
  risks: string[];
  nextWeekActions: string[];
}

interface DailyBriefingResponse {
  output: {
    topPriority: string;
    executionRisk: number;
    riskLevel: string;
    reason: string;
    suggestedAction: string;
    avoidToday: string[];
  };
  offline: boolean;
  internalInsight: {
    summary: string;
    productivityScore: number;
    bestNextAction: string;
    biggestBlocker: string;
  };
  orchestration: {
    rankedTasks: Array<{ title: string }>;
    deadlineRisk: { score: number; label: string };
    burnoutRisk: { score: number };
    cortexInsight: { topRisk: string; bestNextAction: string };
  };
}

interface WeeklyReportResponse {
  output: WeeklyReport;
  offline: boolean;
  internalInsight: {
    summary: string;
    productivityScore: number;
    bestNextAction: string;
    biggestBlocker: string;
  };
}

const fallbackReport: WeeklyReport = {
  summary: 'Weekly AI report is unavailable. AltasAI is using fallback guidance.',
  wins: ['Execution data was captured'],
  risks: ['Not enough AI analysis available'],
  nextWeekActions: ['Keep tasks small', 'Complete reflections', 'Protect focus sessions'],
};

const buildMetrics = (productivityScore: number, executionRisk: number): ReportMetrics => ({
  disciplineScore: Math.max(0, Math.min(100, productivityScore)),
  executionRate: Math.max(0, 100 - executionRisk),
  completedTasks: 0,
  missedTasks: 0,
  carriedTasks: 0,
  focusMinutes: 0,
  goalProgress: 0,
  reflectionConsistency: 0,
  moodAverage: 3,
  energyAverage: 3,
});

const emptyCharts = (): AltasAIReport['charts'] => ({
  executionRate: [],
  disciplineScore: [],
  focusMinutes: [],
  carriedTasks: [],
  moodEnergy: [],
});

export const generateWeeklyReport = async (input?: string): Promise<WeeklyReport> => {
  try {
    const result = await callBackend<{ output: WeeklyReport }>('/api/weekly-report', { input });
    return result.output;
  } catch (error) {
    if (__DEV__) console.warn('[AI] Weekly report unavailable:', getErrorMessage(error));
    return fallbackReport;
  }
};

export const generateDailyReport = async (): Promise<AltasAIReport | null> => {
  try {
    const result = await callBackend<DailyBriefingResponse>('/api/daily-briefing', {});
    const now = Timestamp.now();
    const metrics = buildMetrics(
      result.internalInsight?.productivityScore ?? 50,
      result.output?.executionRisk ?? 30,
    );

    const report: Omit<AltasAIReport, 'id'> = {
      userId: '',
      type: 'daily',
      title: `Daily Briefing — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      summary: result.output?.topPriority ?? result.internalInsight?.summary ?? 'Daily briefing generated.',
      periodStart: now,
      periodEnd: now,
      metrics,
      charts: emptyCharts(),
      priorities: [result.output?.suggestedAction ?? 'Focus on one task'].filter(Boolean),
      riskReasons: [result.output?.reason].filter(Boolean) as string[],
      recommendedFocusWindow: 'First 2 hours after waking',
      strictMentorMessage: result.internalInsight?.bestNextAction ?? 'Execute the top priority before reviewing secondary tasks.',
      warnings: result.output?.avoidToday ?? [],
      biggestWeakness: result.internalInsight?.biggestBlocker ?? 'Not enough signal data yet.',
      biggestWin: result.output?.riskLevel === 'low' ? 'Execution risk is under control.' : 'Signals captured for analysis.',
      nextPlan: [result.output?.suggestedAction ?? 'Complete one task before noon'],
      sections: [
        { title: 'Top Priority', body: result.output?.topPriority ?? 'Generate more data.' },
        { title: 'Risk Assessment', body: `Execution risk: ${result.output?.executionRisk ?? 0}% — ${result.output?.reason ?? 'Minimal signal.'}` },
        { title: 'Suggested Action', body: result.output?.suggestedAction ?? 'Start one task.' },
      ],
      aiGenerated: !result.offline,
      provider: result.offline ? 'internal' : 'gemini',
      offline: result.offline,
      exportStatus: 'ready',
      generatedAt: now,
    };

    const reportId = await addDocument<AltasAIReport>('reports', report as any);
    return { ...report, id: reportId } as AltasAIReport;
  } catch (error) {
    if (__DEV__) console.warn('[AI] Daily report generation failed:', getErrorMessage(error));
    return null;
  }
};

export const generateStoredWeeklyReport = async (input?: string): Promise<AltasAIReport | null> => {
  try {
    const result = await callBackend<WeeklyReportResponse>('/api/weekly-report', { input });
    const now = Timestamp.now();
    const weekAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 86_400_000));
    const metrics = buildMetrics(
      result.internalInsight?.productivityScore ?? 50,
      30,
    );

    const report: Omit<AltasAIReport, 'id'> = {
      userId: '',
      type: 'weekly',
      title: `Weekly Report — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      summary: result.output?.summary ?? result.internalInsight?.summary ?? 'Weekly report generated.',
      periodStart: weekAgo,
      periodEnd: now,
      metrics,
      charts: emptyCharts(),
      priorities: result.output?.nextWeekActions ?? ['Keep tasks small'],
      riskReasons: result.output?.risks ?? [],
      recommendedFocusWindow: 'Morning deep work blocks',
      strictMentorMessage: result.internalInsight?.bestNextAction ?? 'Maintain momentum into next week.',
      warnings: result.output?.risks ?? [],
      biggestWeakness: result.internalInsight?.biggestBlocker ?? 'Consistency needs improvement.',
      biggestWin: result.output?.wins?.[0] ?? 'Signal data captured this week.',
      nextPlan: result.output?.nextWeekActions ?? ['Complete reflections', 'Protect focus sessions'],
      sections: [
        { title: 'Summary', body: result.output?.summary ?? 'Week reviewed.' },
        { title: 'Wins', body: '', items: result.output?.wins ?? [] },
        { title: 'Risks', body: '', items: result.output?.risks ?? [] },
        { title: 'Next Week Plan', body: '', items: result.output?.nextWeekActions ?? [] },
      ],
      aiGenerated: !result.offline,
      provider: result.offline ? 'internal' : 'gemini',
      offline: result.offline,
      exportStatus: 'ready',
      generatedAt: now,
    };

    const reportId = await addDocument<AltasAIReport>('reports', report as any);
    return { ...report, id: reportId } as AltasAIReport;
  } catch (error) {
    if (__DEV__) console.warn('[AI] Weekly report generation failed:', getErrorMessage(error));
    return null;
  }
};

export const generateMonthlyReportPlaceholder = async (): Promise<AltasAIReport | null> => {
  try {
    const now = Timestamp.now();
    const monthAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 86_400_000));

    const report: Omit<AltasAIReport, 'id'> = {
      userId: '',
      type: 'monthly',
      title: `Monthly Report — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      summary: 'Monthly report structure prepared. More data needed for full analysis.',
      periodStart: monthAgo,
      periodEnd: now,
      metrics: buildMetrics(50, 30),
      charts: emptyCharts(),
      priorities: ['Build consistent daily execution', 'Complete reflections regularly'],
      riskReasons: ['Insufficient data for monthly trends'],
      recommendedFocusWindow: 'Morning deep work blocks',
      strictMentorMessage: 'Monthly insights require 4+ weeks of consistent signal data.',
      warnings: ['Not enough data for accurate monthly trends yet'],
      biggestWeakness: 'Data consistency over time',
      biggestWin: 'System is active and tracking.',
      nextPlan: ['Maintain daily task completion', 'Reflect every night', 'Review goals weekly'],
      sections: [
        { title: 'Status', body: 'Monthly report structure is ready. Continue using AltasAI daily to build enough signal for accurate monthly analysis.' },
      ],
      aiGenerated: false,
      provider: 'internal',
      offline: false,
      exportStatus: 'placeholder',
      generatedAt: now,
    };

    const reportId = await addDocument<AltasAIReport>('reports', report as any);
    return { ...report, id: reportId } as AltasAIReport;
  } catch (error) {
    if (__DEV__) console.warn('[AI] Monthly placeholder failed:', getErrorMessage(error));
    return null;
  }
};
