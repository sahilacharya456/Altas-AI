import * as functions from 'firebase-functions';
import { db, enforceRateLimit } from './shared';
import { runCommandAgent } from './ai/agents/commandAgent';
import { runReportAgent } from './ai/agents/reportAgent';
import { runInterventionAgent } from './ai/agents/interventionAgent';
import { runSecurityAgent } from './ai/agents/securityAgent';
import {
    generateAndStoreDailyReport,
    generateAndStoreMonthlyPlaceholder,
    generateAndStoreWeeklyReport,
} from './reportsEngine';

const requireAuth = (context: functions.https.CallableContext): string => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    return context.auth.uid;
};

export const generateDailyBriefing = functions.https.onCall(async (data: { input?: string }, context) => {
    const userId = requireAuth(context);
    await enforceRateLimit(userId, 'dailyBriefing', 8);
    const result = await runCommandAgent(userId, data.input || 'Generate today daily command briefing.');
    await db.doc(`users/${userId}/aiReports/latestDailyBriefing`).set({
        ...result.output,
        provider: result.provider,
        offline: result.offline,
        generatedAt: new Date(),
    }, { merge: true });
    const report = await generateAndStoreDailyReport(userId, result.output, {
        provider: result.provider,
        offline: result.offline,
    });
    return { ...result, report };
});

export const generateWeeklyReport = functions.https.onCall(async (data: { input?: string }, context) => {
    const userId = requireAuth(context);
    await enforceRateLimit(userId, 'weeklyReport', 4);
    const result = await runReportAgent(userId, data.input || 'Generate weekly Atlas report.');
    await db.collection(`users/${userId}/aiReports`).add({
        type: 'weekly',
        report: result.output,
        provider: result.provider,
        offline: result.offline,
        generatedAt: new Date(),
    });
    const report = await generateAndStoreWeeklyReport(userId, result.output, {
        provider: result.provider,
        offline: result.offline,
    });
    return { ...result, report };
});

export const generateDailyReport = functions.https.onCall(async (_data: Record<string, never>, context) => {
    const userId = requireAuth(context);
    await enforceRateLimit(userId, 'dailyReport', 8);
    const report = await generateAndStoreDailyReport(userId, undefined, { offline: true });
    return { report };
});

export const generateMonthlyReportPlaceholder = functions.https.onCall(async (_data: Record<string, never>, context) => {
    const userId = requireAuth(context);
    await enforceRateLimit(userId, 'monthlyReport', 2);
    const report = await generateAndStoreMonthlyPlaceholder(userId);
    return { report };
});

export const generateInterventions = functions.https.onCall(async (data: { input?: string }, context) => {
    const userId = requireAuth(context);
    await enforceRateLimit(userId, 'interventions', 8);
    return runInterventionAgent(userId, data.input || 'Generate intervention suggestions from current Cortex risk.');
});

export const generateSecurityAdvice = functions.https.onCall(async (data: { input: string }, context) => {
    const userId = requireAuth(context);
    await enforceRateLimit(userId, 'securityAdvice', 8);
    if (!data.input || typeof data.input !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'input is required');
    }
    return runSecurityAgent(userId, data.input);
});
