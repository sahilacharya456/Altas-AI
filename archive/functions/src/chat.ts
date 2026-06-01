/**
 * AI Mentor Chat — Cloud Function
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
    db, logger, enforceRateLimit,
    BehaviorPatterns, CortexStateData,
} from './shared';
import { runMentorAgent } from './ai/agents/mentorAgent';

interface ChatRequest {
    message: string;
    conversationId?: string;
    contextType?: 'general' | 'morning' | 'task_review' | 'reflection';
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: admin.firestore.Timestamp;
}

export const chatWithMentor = functions.https.onCall(async (data: ChatRequest, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    if (!data.message || typeof data.message !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Message is required');
    }
    if (data.message.trim().length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Message cannot be empty');
    }
    if (data.message.length > 2000) {
        throw new functions.https.HttpsError('invalid-argument', 'Message too long (max 2000 characters)');
    }

    const userId = context.auth.uid;
    await enforceRateLimit(userId, 'mentor', 10);

    const profileDoc = await db.doc(`users/${userId}/profile/data`).get();
    if (!profileDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found');
    }

    const profile = profileDoc.data();
    const disciplineLevel = profile?.disciplineLevel || 'strict';

    let conversationRef: admin.firestore.DocumentReference;
    let messages: ChatMessage[] = [];

    if (data.conversationId) {
        conversationRef = db.doc(`users/${userId}/conversations/${data.conversationId}`);
        const convDoc = await conversationRef.get();
        if (!convDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Conversation not found');
        }
        messages = convDoc.data()?.messages || [];
    } else {
        conversationRef = db.collection(`users/${userId}/conversations`).doc();
        await conversationRef.set({
            contextType: data.contextType || 'general',
            messages: [],
            isActive: true,
            createdAt: admin.firestore.Timestamp.now(),
            lastMessageAt: admin.firestore.Timestamp.now(),
        });
    }

    const userMessage: ChatMessage = {
        role: 'user',
        content: data.message,
        timestamp: admin.firestore.Timestamp.now(),
    };
    messages.push(userMessage);

    const userContext = await buildIntelligentUserContext(userId, disciplineLevel);

    try {
        const result = await runMentorAgent(userId, `${userContext}\n\nUser message: ${data.message}`);
        const assistantResponse = result.output.response?.trim();
        if (!assistantResponse) {
            throw new Error('AI gateway returned an empty mentor response');
        }

        messages.push({ role: 'assistant', content: assistantResponse, timestamp: admin.firestore.Timestamp.now() });

        await conversationRef.update({ messages, lastMessageAt: admin.firestore.Timestamp.now() });
        await db.collection(`users/${userId}/aiFeedback`).add({
            type: data.contextType || 'general',
            prompt: data.message.substring(0, 500),
            response: assistantResponse,
            model: result.provider,
            offline: result.offline,
            createdAt: admin.firestore.Timestamp.now(),
        });

        return { response: assistantResponse, conversationId: conversationRef.id };
    } catch (error) {
        logger.error('Gemini chat error', { userId, error });
        throw new functions.https.HttpsError('internal', 'Request failed');
    }
});

// ─── Context Builder ───

async function buildIntelligentUserContext(userId: string, disciplineLevel: string): Promise<string> {
    try {
        const cortexDoc = await db.doc(`users/${userId}/ai_cortex_state`).get();
        if (cortexDoc.exists) {
            const cortex = cortexDoc.data() as CortexStateData;
            const ageMs = Date.now() - cortex.lastUpdated.toMillis();
            if (ageMs < 30 * 60 * 1000) {
                return formatCortexContext(cortex, disciplineLevel);
            }
        }

        const [profileDoc, patterns, tasksSnapshot, goalsSnapshot, carriedSnapshot] = await Promise.all([
            db.doc(`users/${userId}/profile/data`).get(),
            analyzeBehaviorPatterns(userId),
            (() => { const t = new Date(); t.setHours(0,0,0,0); const tm = new Date(t); tm.setDate(tm.getDate()+1); return db.collection(`users/${userId}/tasks`).where('scheduledDate','>=',admin.firestore.Timestamp.fromDate(t)).where('scheduledDate','<',admin.firestore.Timestamp.fromDate(tm)).get(); })(),
            db.collection(`users/${userId}/goals`).where('status','==','active').limit(5).get(),
            db.collection(`users/${userId}/tasks`).where('status','==','carried').limit(10).get(),
        ]);

        const profile = profileDoc.data();
        const tasks = tasksSnapshot.docs.map(d => d.data());
        const completed = tasks.filter(t => t.status === 'completed').length;
        const goals = goalsSnapshot.docs.map(d => d.data());
        const urgentGoals = goals.filter(g => {
            if (!g.targetDate) return false;
            const days = Math.ceil((g.targetDate.toMillis() - Date.now()) / 86400000);
            return days <= 7 && days > 0;
        });
        const carried = carriedSnapshot.docs.map(d => d.data());

        const cortexData: CortexStateData = {
            profileName: profile?.displayName || 'User',
            disciplineLevel,
            disciplineScore: profile?.currentScores?.discipline || 50,
            completedToday: completed,
            totalToday: tasks.length,
            carriedCount: carried.length,
            carriedTitles: carried.slice(0, 3).map(t => t.title as string),
            activeGoalCount: goals.length,
            urgentGoals: urgentGoals.map(g => ({ title: g.title as string, daysLeft: Math.ceil((g.targetDate.toMillis() - Date.now()) / 86400000) })),
            patterns,
            lastUpdated: admin.firestore.Timestamp.now(),
        };

        return formatCortexContext(cortexData, disciplineLevel);
    } catch (error) {
        logger.error('Error building intelligent context', { userId, error });
        return 'USER CONTEXT: Unable to load behavioral data';
    }
}

function formatCortexContext(c: CortexStateData, disciplineLevel: string): string {
    const modeDirective = disciplineLevel === 'ruthless'
        ? `RUTHLESS MODE: Zero tolerance for excuses (especially "${c.patterns.topExcuse}"). Call out contradictions. No fluff.`
        : disciplineLevel === 'strict'
            ? 'STRICT MODE: Hold accountable but fair. Point out patterns. Push for consistency.'
            : 'MENTOR MODE: Be supportive. Gently point out patterns. Focus on growth.';

    return `USER: ${c.profileName} | Discipline: ${disciplineLevel} | Score: ${c.disciplineScore}/100
TASKS TODAY: ${c.completedToday}/${c.totalToday} | Carried: ${c.carriedCount} ${c.carriedTitles.length > 0 ? '(' + c.carriedTitles.join(', ') + ')' : ''}
BEHAVIOR: ${c.patterns.completionTrend}% completion (${c.patterns.trendDirection}) | Streak: ${c.patterns.reflectionStreak}d | Mood: ${c.patterns.averageMood}/5 | Energy: ${c.patterns.energyTrend}
${c.urgentGoals.length > 0 ? 'URGENT GOALS: ' + c.urgentGoals.map(g => `"${g.title}" ${g.daysLeft}d left`).join(', ') : ''}
${modeDirective}
Time: ${new Date().toLocaleTimeString()}`.trim();
}

async function analyzeBehaviorPatterns(userId: string): Promise<BehaviorPatterns> {
    try {
        const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const twoWeeksAgo2 = new Date(oneWeekAgo); twoWeeksAgo2.setDate(oneWeekAgo.getDate() - 7);

        const [logsSnapshot, thisWeekTasks, lastWeekTasks] = await Promise.all([
            db.collection(`users/${userId}/dailyLogs`).where('date', '>=', admin.firestore.Timestamp.fromDate(twoWeeksAgo)).orderBy('date', 'desc').limit(14).get(),
            db.collection(`users/${userId}/tasks`).where('scheduledDate', '>=', admin.firestore.Timestamp.fromDate(oneWeekAgo)).get(),
            db.collection(`users/${userId}/tasks`).where('scheduledDate', '>=', admin.firestore.Timestamp.fromDate(twoWeeksAgo2)).where('scheduledDate', '<', admin.firestore.Timestamp.fromDate(oneWeekAgo)).get(),
        ]);

        const logs = logsSnapshot.docs.map(d => d.data());
        const struggleFreq: Record<string, number> = {};
        logs.flatMap(l => (l.struggles as string[]) || []).forEach(s => {
            const n = s.toLowerCase().trim(); struggleFreq[n] = (struggleFreq[n] || 0) + 1;
        });
        const sorted = Object.entries(struggleFreq).sort((a, b) => b[1] - a[1]);

        const twc = thisWeekTasks.docs.filter(d => d.data().status === 'completed').length;
        const twt = thisWeekTasks.size || 1;
        const lwc = lastWeekTasks.docs.filter(d => d.data().status === 'completed').length;
        const lwt = lastWeekTasks.size || 1;
        const thisWeekRate = Math.round((twc / twt) * 100);
        const lastWeekRate = Math.round((lwc / lwt) * 100);

        let streak = 0;
        const sortedLogs = [...logs].sort((a, b) => b.date.toMillis() - a.date.toMillis());
        for (const log of sortedLogs) {
            const exp = new Date(); exp.setDate(exp.getDate() - streak); exp.setHours(0,0,0,0);
            if (new Date(log.date.toMillis()).toISOString().split('T')[0] === exp.toISOString().split('T')[0]) { streak++; } else { break; }
        }

        const avgMood = logs.reduce((s, l) => s + ((l.mood as number) || 0), 0) / (logs.length || 1);
        const r7 = logs.slice(0, 7), o7 = logs.slice(7, 14);
        const re = r7.reduce((s, l) => s + ((l.energyLevel as number) || 0), 0) / (r7.length || 1);
        const oe = o7.reduce((s, l) => s + ((l.energyLevel as number) || 0), 0) / (o7.length || 1);

        return {
            completionTrend: thisWeekRate,
            trendDirection: thisWeekRate > lastWeekRate + 10 ? 'improving' : thisWeekRate < lastWeekRate - 10 ? 'declining' : 'stable',
            topExcuse: sorted[0]?.[0] || 'none', excuseCount: sorted[0]?.[1] || 0,
            reflectionStreak: streak, averageMood: avgMood.toFixed(1),
            energyTrend: re > oe + 0.5 ? 'increasing' : re < oe - 0.5 ? 'decreasing' : 'stable',
        };
    } catch (error) {
        logger.error('Error analyzing patterns', { userId, error });
        return { completionTrend: 0, trendDirection: 'unknown', topExcuse: 'none', excuseCount: 0, reflectionStreak: 0, averageMood: '3', energyTrend: 'stable' };
    }
}
