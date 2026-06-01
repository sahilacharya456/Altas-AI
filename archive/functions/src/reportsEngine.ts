import * as admin from 'firebase-admin';
import { db } from './shared';
import type { DailyBriefing, WeeklyReport } from './ai/schemas';

type ReportType = 'daily' | 'weekly' | 'monthly';

interface ReportMetricPoint {
    label: string;
    value: number;
    secondaryValue?: number;
}

interface AtlasReportDocument {
    userId: string;
    type: ReportType;
    title: string;
    summary: string;
    periodStart: admin.firestore.Timestamp;
    periodEnd: admin.firestore.Timestamp;
    metrics: {
        disciplineScore: number;
        executionRate: number;
        completedTasks: number;
        missedTasks: number;
        carriedTasks: number;
        focusMinutes: number;
        goalProgress: number;
        reflectionConsistency: number;
        moodAverage: number;
        energyAverage: number;
    };
    charts: {
        executionRate: ReportMetricPoint[];
        disciplineScore: ReportMetricPoint[];
        focusMinutes: ReportMetricPoint[];
        carriedTasks: ReportMetricPoint[];
        moodEnergy: ReportMetricPoint[];
    };
    priorities: string[];
    riskReasons: string[];
    recommendedFocusWindow: string;
    strictMentorMessage: string;
    warnings: string[];
    biggestWeakness: string;
    biggestWin: string;
    nextPlan: string[];
    sections: Array<{ title: string; body: string; items?: string[] }>;
    aiGenerated: boolean;
    provider?: string;
    offline?: boolean;
    exportStatus: 'placeholder' | 'ready';
    generatedAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
}

interface AIMeta {
    provider?: string;
    offline?: boolean;
}

const timestamp = admin.firestore.Timestamp;

const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value));

const toDate = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof admin.firestore.Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate();
    }
    return null;
};

const isInRange = (value: unknown, start: Date, end: Date): boolean => {
    const date = toDate(value);
    if (!date) return false;
    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
};

const formatDay = (date: Date): string =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const getPeriod = (type: ReportType): { start: Date; end: Date } => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);

    if (type === 'daily') {
        start.setHours(0, 0, 0, 0);
    } else if (type === 'weekly') {
        start.setDate(end.getDate() - 6);
        start.setHours(0, 0, 0, 0);
    } else {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
    }

    return { start, end };
};

const readCollection = async (userId: string, collectionName: string, maxDocs = 200): Promise<Record<string, unknown>[]> => {
    const snapshot = await db.collection(`users/${userId}/${collectionName}`).limit(maxDocs).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const readProfile = async (userId: string): Promise<Record<string, unknown>> => {
    const snapshot = await db.doc(`users/${userId}/profile/data`).get();
    return snapshot.exists ? snapshot.data() ?? {} : {};
};

const readRiskState = async (userId: string): Promise<Record<string, unknown>> => {
    const snapshot = await db.doc(`users/${userId}/cortex/riskState`).get();
    return snapshot.exists ? snapshot.data() ?? {} : {};
};

const numberField = (item: Record<string, unknown>, field: string, fallback = 0): number => {
    const value = item[field];
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};

const stringField = (item: Record<string, unknown>, field: string, fallback = ''): string => {
    const value = item[field];
    return typeof value === 'string' ? value : fallback;
};

const buildChartSeries = (
    analytics: Record<string, unknown>[],
    days: number,
    field: string,
    fallbackValue = 0
): ReportMetricPoint[] => {
    const byDay = new Map(
        analytics
            .map((item) => {
                const date = toDate(item.date);
                return date ? [date.toISOString().split('T')[0], item] as const : null;
            })
            .filter((item): item is readonly [string, Record<string, unknown>] => Boolean(item))
    );

    return Array.from({ length: days }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - index));
        const key = date.toISOString().split('T')[0];
        const item = byDay.get(key);
        return {
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
            value: item ? numberField(item, field, fallbackValue) : fallbackValue,
        };
    });
};

const buildMoodEnergySeries = (
    logs: Record<string, unknown>[],
    days: number
): ReportMetricPoint[] => {
    const byDay = new Map(
        logs
            .map((item) => {
                const date = toDate(item.date);
                return date ? [date.toISOString().split('T')[0], item] as const : null;
            })
            .filter((item): item is readonly [string, Record<string, unknown>] => Boolean(item))
    );

    return Array.from({ length: days }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - index));
        const item = byDay.get(date.toISOString().split('T')[0]);
        return {
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
            value: item ? numberField(item, 'mood', 0) : 0,
            secondaryValue: item ? numberField(item, 'energyLevel', 0) : 0,
        };
    });
};

const getRecommendedFocusWindow = (profile: Record<string, unknown>, logs: Record<string, unknown>[]): string => {
    const lifeRhythm = profile.lifeRhythm as Record<string, unknown> | undefined;
    const wakeTime = typeof lifeRhythm?.wakeTime === 'string' ? lifeRhythm.wakeTime : '07:00';
    const lowEnergyDays = logs.filter((log) => numberField(log, 'energyLevel', 3) <= 2).length;
    return lowEnergyDays >= 3
        ? 'Late morning after a recovery routine'
        : `First protected block after ${wakeTime}`;
};

const collectExternalWarnings = (
    digital: Record<string, unknown>[],
    budgets: Record<string, unknown>[],
    securityEvents: Record<string, unknown>[],
    healthLogs: Record<string, unknown>[]
): string[] => {
    const warnings: string[] = [];
    const latestDigital = digital[0];
    if (latestDigital && numberField(latestDigital, 'screenMinutes') > numberField(latestDigital, 'goalMinutes', 999)) {
        warnings.push('Digital usage exceeded the configured goal.');
    }

    const currentBudget = budgets[0];
    if (currentBudget && numberField(currentBudget, 'spent') > numberField(currentBudget, 'totalBudget', Number.MAX_SAFE_INTEGER)) {
        warnings.push('Budget spending is over the configured limit.');
    }

    if (securityEvents.some((event) => !event.resolved && ['high', 'critical'].includes(stringField(event, 'severity')))) {
        warnings.push('Unresolved high-risk security event detected.');
    }

    const latestHealth = healthLogs[0];
    if (latestHealth && (numberField(latestHealth, 'sleepHours', 7) < 6 || numberField(latestHealth, 'energyLevel', 3) <= 2)) {
        warnings.push('Recovery signal is weak: sleep or energy is below target.');
    }

    return warnings;
};

const topPriorities = (tasks: Record<string, unknown>[]): string[] => {
    const priorityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...tasks]
        .filter((task) => !['completed', 'cancelled'].includes(stringField(task, 'status')))
        .sort((a, b) => {
            const priorityDelta = (priorityRank[stringField(b, 'priority')] ?? 0) - (priorityRank[stringField(a, 'priority')] ?? 0);
            if (priorityDelta !== 0) return priorityDelta;
            return numberField(b, 'carryCount') - numberField(a, 'carryCount');
        })
        .slice(0, 3)
        .map((task) => stringField(task, 'title', 'Untitled action'));
};

const buildBaseReport = async (
    userId: string,
    type: ReportType,
    aiWeekly?: WeeklyReport,
    aiDaily?: DailyBriefing,
    aiMeta?: AIMeta
): Promise<AtlasReportDocument> => {
    const { start, end } = getPeriod(type);
    const [profile, riskState, tasks, goals, logs, sessions, analytics, digital, budgets, securityEvents, healthLogs] = await Promise.all([
        readProfile(userId),
        readRiskState(userId),
        readCollection(userId, 'tasks'),
        readCollection(userId, 'goals'),
        readCollection(userId, 'dailyLogs'),
        readCollection(userId, 'focusSessions'),
        readCollection(userId, 'analytics'),
        readCollection(userId, 'digitalUsage'),
        readCollection(userId, 'budgets'),
        readCollection(userId, 'securityEvents'),
        readCollection(userId, 'healthLogs'),
    ]);

    const periodTasks = tasks.filter((task) =>
        isInRange(task.scheduledDate, start, end) ||
        isInRange(task.completedAt, start, end) ||
        isInRange(task.createdAt, start, end)
    );
    const periodLogs = logs.filter((log) => isInRange(log.date, start, end));
    const periodSessions = sessions.filter((session) => isInRange(session.startedAt, start, end));
    const periodAnalytics = analytics.filter((item) => isInRange(item.date, start, end));
    const periodGoals = goals.filter((goal) => stringField(goal, 'status') !== 'abandoned');

    const completedTasks = periodTasks.filter((task) => stringField(task, 'status') === 'completed').length;
    const missedTasks = periodTasks.filter((task) => stringField(task, 'status') === 'pending' && isInRange(task.scheduledDate, start, end)).length;
    const carriedTasks = periodTasks.filter((task) => stringField(task, 'status') === 'carried' || numberField(task, 'carryCount') > 0).length;
    const totalRelevantTasks = Math.max(1, completedTasks + missedTasks + carriedTasks);
    const executionRate = Math.round((completedTasks / totalRelevantTasks) * 100);
    const focusMinutes = periodSessions.reduce((sum, session) => sum + numberField(session, 'durationMinutes'), 0);
    const goalProgress = periodGoals.length
        ? Math.round(periodGoals.reduce((sum, goal) => sum + numberField(goal, 'progress'), 0) / periodGoals.length)
        : 0;
    const moodAverage = periodLogs.length
        ? Math.round((periodLogs.reduce((sum, log) => sum + numberField(log, 'mood'), 0) / periodLogs.length) * 10) / 10
        : 0;
    const energyAverage = periodLogs.length
        ? Math.round((periodLogs.reduce((sum, log) => sum + numberField(log, 'energyLevel'), 0) / periodLogs.length) * 10) / 10
        : 0;
    const reflectionConsistency = type === 'daily'
        ? (periodLogs.length ? 100 : 0)
        : Math.round((periodLogs.length / 7) * 100);
    const currentScores = profile.currentScores as Record<string, unknown> | undefined;
    const disciplineScore = typeof currentScores?.discipline === 'number'
        ? currentScores.discipline
        : Math.max(0, 70 + completedTasks * 3 - carriedTasks * 5 - missedTasks * 4);

    const riskReasons = Array.isArray(riskState.reasons) && riskState.reasons.every((item) => typeof item === 'string')
        ? riskState.reasons as string[]
        : [];
    if (carriedTasks > 0) riskReasons.push(`${carriedTasks} carried task${carriedTasks === 1 ? '' : 's'} created execution debt.`);
    if (reflectionConsistency < 50) riskReasons.push('Reflection consistency is too low for reliable self-correction.');
    if (energyAverage > 0 && energyAverage <= 2.5) riskReasons.push('Energy signal is weak for the current task load.');

    const warnings = collectExternalWarnings(digital, budgets, securityEvents, healthLogs);
    const priorities = topPriorities(periodTasks);
    const recommendedFocusWindow = getRecommendedFocusWindow(profile, periodLogs);
    const biggestWeakness = riskReasons[0] ?? (executionRate < 50 ? 'Execution rate is below operating standard.' : 'Not enough risk data yet.');
    const biggestWin = aiWeekly?.wins?.[0] ?? (completedTasks > 0 ? `${completedTasks} task${completedTasks === 1 ? '' : 's'} completed.` : 'Signals were captured for review.');
    const nextPlan = aiWeekly?.nextWeekActions?.length
        ? aiWeekly.nextWeekActions
        : ['Pick the top 3 outcomes only.', 'Protect one focus block before reactive work.', 'Complete the daily reflection even if execution was poor.'];
    const strictMentorMessage = type === 'daily'
        ? aiDaily?.suggestedAction ?? 'Do not negotiate with the task list. Pick the top priority and start the first focus block.'
        : 'The report is only useful if it changes next week. Cut the plan to what you will actually execute.';

    const analyticsDays = type === 'daily' ? 1 : 7;
    const summary = type === 'daily'
        ? `Daily command briefing for ${formatDay(end)}: execution risk is ${numberField(riskState, 'executionRiskScore', 35)}%, with ${priorities.length || 0} priority action${priorities.length === 1 ? '' : 's'} identified.`
        : aiWeekly?.summary ?? `Weekly report: ${executionRate}% execution rate, ${completedTasks} completed tasks, ${carriedTasks} carried tasks, and ${focusMinutes} focus minutes.`;

    return {
        userId,
        type,
        title: type === 'daily' ? 'Daily Command Briefing' : type === 'weekly' ? 'Weekly AI Performance Report' : 'Monthly Report Preview',
        summary,
        periodStart: timestamp.fromDate(start),
        periodEnd: timestamp.fromDate(end),
        metrics: {
            disciplineScore: clamp(Math.round(disciplineScore)),
            executionRate: clamp(executionRate),
            completedTasks,
            missedTasks,
            carriedTasks,
            focusMinutes,
            goalProgress: clamp(goalProgress),
            reflectionConsistency: clamp(reflectionConsistency),
            moodAverage,
            energyAverage,
        },
        charts: {
            executionRate: buildChartSeries(periodAnalytics, analyticsDays, 'productivityScore', executionRate),
            disciplineScore: buildChartSeries(periodAnalytics, analyticsDays, 'disciplineScore', Math.round(disciplineScore)),
            focusMinutes: buildChartSeries(periodAnalytics, analyticsDays, 'focusMinutes', 0),
            carriedTasks: buildChartSeries(periodAnalytics, analyticsDays, 'tasksCarried', 0),
            moodEnergy: buildMoodEnergySeries(periodLogs, analyticsDays),
        },
        priorities: priorities.length ? priorities : ['Create one clear execution task'],
        riskReasons: riskReasons.length ? riskReasons.slice(0, 5) : ['No severe risk detected from current deterministic signals.'],
        recommendedFocusWindow,
        strictMentorMessage,
        warnings,
        biggestWeakness,
        biggestWin,
        nextPlan,
        sections: [
            {
                title: 'Execution',
                body: `${completedTasks} completed, ${missedTasks} missed, ${carriedTasks} carried. Execution rate: ${executionRate}%.`,
            },
            {
                title: 'Goals',
                body: periodGoals.length ? `Average goal progress is ${goalProgress}%.` : 'No active goal signal is available yet.',
            },
            {
                title: 'Reflection',
                body: `Reflection consistency is ${reflectionConsistency}%. Mood average: ${moodAverage || 'n/a'}, energy average: ${energyAverage || 'n/a'}.`,
            },
            {
                title: 'Cross-domain discipline',
                body: warnings.length ? 'Warnings were detected across secondary modules.' : 'No finance, health, digital, or security warning was detected.',
                items: warnings,
            },
        ],
        aiGenerated: Boolean(aiWeekly || aiDaily) && !aiMeta?.offline,
        provider: aiMeta?.provider,
        offline: aiMeta?.offline,
        exportStatus: 'placeholder',
        generatedAt: timestamp.now(),
        updatedAt: timestamp.now(),
    };
};

const reportId = (type: ReportType, end: admin.firestore.Timestamp): string => {
    const date = end.toDate();
    if (type === 'monthly') {
        return `monthly_${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    }
    return `${type}_${date.toISOString().split('T')[0]}`;
};

const storeReport = async (report: AtlasReportDocument): Promise<AtlasReportDocument & { id: string }> => {
    const id = reportId(report.type, report.periodEnd);
    await db.doc(`users/${report.userId}/reports/${id}`).set(report, { merge: true });
    return { id, ...report };
};

export const generateAndStoreDailyReport = async (
    userId: string,
    aiDaily?: DailyBriefing,
    aiMeta?: AIMeta
): Promise<AtlasReportDocument & { id: string }> => {
    const report = await buildBaseReport(userId, 'daily', undefined, aiDaily, aiMeta);
    return storeReport(report);
};

export const generateAndStoreWeeklyReport = async (
    userId: string,
    aiWeekly?: WeeklyReport,
    aiMeta?: AIMeta
): Promise<AtlasReportDocument & { id: string }> => {
    const report = await buildBaseReport(userId, 'weekly', aiWeekly, undefined, aiMeta);
    return storeReport(report);
};

export const generateAndStoreMonthlyPlaceholder = async (
    userId: string
): Promise<AtlasReportDocument & { id: string }> => {
    const report = await buildBaseReport(userId, 'monthly');
    return storeReport({
        ...report,
        summary: 'Monthly reporting structure is prepared. Full month-over-month analysis will be enabled after enough daily and weekly reports accumulate.',
        sections: [
            ...report.sections,
            {
                title: 'Monthly export',
                body: 'PDF and shareable export are intentionally placeholder-only in this phase.',
            },
        ],
    });
};
