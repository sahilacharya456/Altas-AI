/**
 * Cortex Behavior Intelligence
 * Deterministic Signals -> Cortex layer. No LLM dependency.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { db, logger, CortexStateData } from './shared';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
type BehaviorSource = 'tasks' | 'goals' | 'reflection' | 'finance' | 'health' | 'digital' | 'security' | 'focus' | 'mentor' | 'system';
type BehaviorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface BehaviorEventData {
    userId: string;
    source: BehaviorSource;
    eventType: string;
    severity: BehaviorSeverity;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
    createdAt: admin.firestore.Timestamp;
}

interface RiskState {
    userId: string;
    executionRiskScore: number;
    riskLevel: RiskLevel;
    reasons: string[];
    recommendedAction: string;
    updatedAt: admin.firestore.Timestamp;
    signalSnapshot: {
        pendingTaskCount: number;
        carriedTaskCount: number;
        missedOrOverdueTaskCount: number;
        lowEnergy: boolean;
        missedReflection: boolean;
        highDigitalUsage: boolean;
        budgetRisk: boolean;
        securityRisk: boolean;
    };
}

const nowTs = () => admin.firestore.Timestamp.now();

const getDayBounds = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return {
        start,
        end,
        startTs: admin.firestore.Timestamp.fromDate(start),
        endTs: admin.firestore.Timestamp.fromDate(end),
    };
};

export const riskLevelForScore = (score: number): RiskLevel => {
    if (score >= 80) return 'critical';
    if (score >= 55) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
};

const severityForPriority = (priority?: string): BehaviorSeverity => {
    if (priority === 'critical') return 'critical';
    if (priority === 'high') return 'high';
    if (priority === 'medium') return 'medium';
    return 'low';
};

async function createBehaviorEvent(
    uid: string,
    stableId: string,
    data: Omit<BehaviorEventData, 'userId' | 'createdAt'>
): Promise<void> {
    const ref = db.doc(`users/${uid}/behaviorEvents/${stableId}`);
    const exists = await ref.get();
    if (exists.exists) return;

    await ref.set({
        userId: uid,
        ...data,
        createdAt: nowTs(),
    } satisfies BehaviorEventData);
}

async function calculateRiskState(uid: string): Promise<RiskState> {
    const { startTs, endTs } = getDayBounds();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const [
        tasksSnap,
        logsSnap,
        digitalSnap,
        budgetSnap,
        securitySnap,
    ] = await Promise.all([
        db.collection(`users/${uid}/tasks`)
            .where('scheduledDate', '>=', startTs)
            .where('scheduledDate', '<', endTs)
            .limit(100)
            .get(),
        db.collection(`users/${uid}/dailyLogs`)
            .where('date', '>=', admin.firestore.Timestamp.fromDate(fourteenDaysAgo))
            .orderBy('date', 'desc')
            .limit(14)
            .get(),
        db.collection(`users/${uid}/digitalUsage`)
            .where('date', '>=', startTs)
            .where('date', '<', endTs)
            .limit(1)
            .get(),
        db.collection(`users/${uid}/budgets`)
            .orderBy('month', 'desc')
            .limit(1)
            .get(),
        db.collection(`users/${uid}/securityEvents`)
            .where('resolved', '==', false)
            .limit(20)
            .get(),
    ]);

    const tasks = tasksSnap.docs.map((doc) => doc.data());
    const logs = logsSnap.docs.map((doc) => doc.data());
    const digital = digitalSnap.docs[0]?.data();
    const budget = budgetSnap.docs[0]?.data();
    const securityEvents = securitySnap.docs.map((doc) => doc.data());
    const todayLog = logs[0];
    const now = Date.now();

    const pendingTaskCount = tasks.filter((task) => task.status === 'pending' || task.status === 'in_progress').length;
    const carriedTaskCount = tasks.filter((task) => task.isCarried === true || task.status === 'carried').length;
    const missedOrOverdueTaskCount = tasks.filter((task) => {
        const scheduled = task.scheduledDate as admin.firestore.Timestamp | undefined;
        return scheduled
            && scheduled.toMillis() < now
            && task.status !== 'completed'
            && task.status !== 'cancelled';
    }).length;
    const lowEnergy = Boolean(todayLog && Number(todayLog.energyLevel) <= 2);
    const missedReflection = !todayLog;
    const highDigitalUsage = Boolean(digital?.exceeded);
    const budgetRisk = Boolean(budget && Number(budget.spent ?? 0) > Number(budget.totalBudget ?? 0));
    const securityRisk = securityEvents.some((event) => event.severity === 'high' || event.severity === 'critical');

    const reasons: string[] = [];
    let score = 0;

    if (pendingTaskCount >= 6) {
        score += 18;
        reasons.push(`${pendingTaskCount} tasks are pending or active today.`);
    } else if (pendingTaskCount >= 3) {
        score += 10;
        reasons.push(`${pendingTaskCount} tasks still need execution.`);
    }
    if (carriedTaskCount > 0) {
        score += Math.min(24, carriedTaskCount * 8);
        reasons.push(`${carriedTaskCount} carried task${carriedTaskCount === 1 ? '' : 's'} create execution debt.`);
    }
    if (missedOrOverdueTaskCount > 0) {
        score += Math.min(24, missedOrOverdueTaskCount * 8);
        reasons.push(`${missedOrOverdueTaskCount} task${missedOrOverdueTaskCount === 1 ? ' is' : 's are'} overdue.`);
    }
    if (lowEnergy) {
        score += 16;
        reasons.push('Reflection energy is low.');
    }
    if (missedReflection) {
        score += 8;
        reasons.push('No reflection has been logged today.');
    }
    if (highDigitalUsage) {
        score += 12;
        reasons.push('Digital usage is above goal.');
    }
    if (budgetRisk) {
        score += 10;
        reasons.push('Budget usage is above limit.');
    }
    if (securityRisk) {
        score += 16;
        reasons.push('Unresolved high-severity security risk exists.');
    }

    const executionRiskScore = Math.min(100, Math.max(0, score));
    const riskLevel = riskLevelForScore(executionRiskScore);

    return {
        userId: uid,
        executionRiskScore,
        riskLevel,
        reasons: reasons.length ? reasons : ['No major deterministic risk signal detected.'],
        recommendedAction: getRecommendedAction(riskLevel, reasons),
        updatedAt: nowTs(),
        signalSnapshot: {
            pendingTaskCount,
            carriedTaskCount,
            missedOrOverdueTaskCount,
            lowEnergy,
            missedReflection,
            highDigitalUsage,
            budgetRisk,
            securityRisk,
        },
    };
}

export function getRecommendedAction(riskLevel: RiskLevel, reasons: string[]): string {
    if (riskLevel === 'critical') return 'Stop adding work. Clear one overdue or carried task immediately.';
    if (riskLevel === 'high') return 'Start one focused execution block on the highest-risk task.';
    if (reasons.some((reason) => reason.includes('reflection'))) return 'Log a short reflection to restore behavior signal quality.';
    return 'Maintain the current plan and protect the next focus block.';
}

async function rebuildCortexState(uid: string): Promise<void> {
    const riskState = await calculateRiskState(uid);
    const { startTs, endTs } = getDayBounds();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [profileDoc, goalsSnap, tasksSnap, eventsSnap, logsSnap] = await Promise.all([
        db.doc(`users/${uid}/profile/data`).get(),
        db.collection(`users/${uid}/goals`).where('status', '==', 'active').limit(10).get(),
        db.collection(`users/${uid}/tasks`).where('scheduledDate', '>=', startTs).where('scheduledDate', '<', endTs).limit(100).get(),
        db.collection(`users/${uid}/behaviorEvents`).orderBy('createdAt', 'desc').limit(20).get(),
        db.collection(`users/${uid}/dailyLogs`).where('date', '>=', admin.firestore.Timestamp.fromDate(weekAgo)).orderBy('date', 'desc').limit(7).get(),
    ]);

    const profile = profileDoc.data();
    const tasks = tasksSnap.docs.map((doc) => doc.data());
    const goals = goalsSnap.docs.map((doc) => doc.data());
    const events = eventsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const logs = logsSnap.docs.map((doc) => doc.data());
    const completedToday = tasks.filter((task) => task.status === 'completed').length;
    const carriedTasks = tasks.filter((task) => task.isCarried === true || task.status === 'carried');
    const avgEnergy = logs.length
        ? logs.reduce((sum, log) => sum + Number(log.energyLevel ?? 0), 0) / logs.length
        : null;

    const daily = {
        userId: uid,
        generatedAt: nowTs(),
        executionRiskScore: riskState.executionRiskScore,
        riskLevel: riskState.riskLevel,
        completedToday,
        totalToday: tasks.length,
        pendingToday: riskState.signalSnapshot.pendingTaskCount,
        carriedToday: riskState.signalSnapshot.carriedTaskCount,
        reasons: riskState.reasons,
        recommendedAction: riskState.recommendedAction,
    };

    const weekly = {
        userId: uid,
        generatedAt: nowTs(),
        reflectionEntries: logs.length,
        averageEnergy: avgEnergy,
        eventCount: events.length,
        placeholder: 'Weekly Cortex report will mature after more behavior history is available.',
    };

    const patterns = {
        userId: uid,
        generatedAt: nowTs(),
        primaryPatterns: buildPatterns(riskState, events),
        disciplineTrend: 'placeholder',
        weeklySummary: 'Deterministic pattern extraction is active. Trend modeling will improve as history grows.',
    };

    await Promise.all([
        db.doc(`users/${uid}/cortex/daily`).set(daily, { merge: true }),
        db.doc(`users/${uid}/cortex/weekly`).set(weekly, { merge: true }),
        db.doc(`users/${uid}/cortex/patterns`).set(patterns, { merge: true }),
        db.doc(`users/${uid}/cortex/riskState`).set(riskState, { merge: true }),
    ]);

    const urgentGoals = goals.filter((goal) => {
        const target = goal.targetDate as admin.firestore.Timestamp | undefined;
        if (!target) return false;
        const days = Math.ceil((target.toMillis() - Date.now()) / 86400000);
        return days <= 7 && days > 0;
    });

    const legacyCortexData: CortexStateData = {
        profileName: profile?.displayName || 'User',
        disciplineLevel: profile?.disciplineLevel || 'strict',
        disciplineScore: profile?.currentScores?.discipline || 50,
        completedToday,
        totalToday: tasks.length,
        carriedCount: carriedTasks.length,
        carriedTitles: carriedTasks.slice(0, 3).map((task) => String(task.title)),
        activeGoalCount: goals.length,
        urgentGoals: urgentGoals.map((goal) => ({
            title: String(goal.title),
            daysLeft: Math.ceil(((goal.targetDate as admin.firestore.Timestamp).toMillis() - Date.now()) / 86400000),
        })),
        patterns: {
            completionTrend: tasks.length > 0 ? Math.round((completedToday / tasks.length) * 100) : 0,
            trendDirection: riskState.riskLevel === 'high' || riskState.riskLevel === 'critical' ? 'declining' : 'stable',
            topExcuse: 'none',
            excuseCount: 0,
            reflectionStreak: logs.length,
            averageMood: logs.length
                ? (logs.reduce((sum, log) => sum + Number(log.mood ?? 0), 0) / logs.length).toFixed(1)
                : 'unknown',
            energyTrend: 'stable',
        },
        lastUpdated: nowTs(),
    };

    await db.doc(`users/${uid}/ai_cortex_state`).set(legacyCortexData, { merge: true });
    logger.info('Cortex summaries rebuilt', { uid, riskLevel: riskState.riskLevel, score: riskState.executionRiskScore });
}

function buildPatterns(riskState: RiskState, events: Array<Record<string, unknown>>): string[] {
    const patterns: string[] = [];
    if (riskState.signalSnapshot.carriedTaskCount > 0) patterns.push('Execution debt is present through carried tasks.');
    if (riskState.signalSnapshot.missedReflection) patterns.push('Reflection signal is missing today.');
    if (riskState.signalSnapshot.lowEnergy) patterns.push('Low energy may reduce execution reliability.');
    if (events.some((event) => event.source === 'focus')) patterns.push('Focus sessions are now feeding Cortex.');
    if (!patterns.length) patterns.push('No major negative behavior pattern detected yet.');
    return patterns;
}

/**
 * Manual test helper.
 */
export async function testCortexRebuild(uid: string): Promise<void> {
    await rebuildCortexState(uid);
    const doc = await db.doc(`users/${uid}/cortex/riskState`).get();
    logger.info('Cortex test rebuild complete', { uid, exists: doc.exists, data: doc.data() });
}

function getTaskEvent(change: functions.Change<functions.firestore.DocumentSnapshot>): {
    eventType: string;
    title: string;
    message: string;
    severity: BehaviorSeverity;
} | null {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;
    if (!after) return null;

    if (!before) {
        return {
            eventType: 'task_created',
            title: String(after.title || 'Task created'),
            message: 'A new execution task was created.',
            severity: severityForPriority(after.priority),
        };
    }

    if (before.status !== after.status) {
        return {
            eventType: `task_${after.status}`,
            title: String(after.title || 'Task status changed'),
            message: `Task status changed from ${before.status} to ${after.status}.`,
            severity: after.status === 'carried' || after.status === 'cancelled' ? 'medium' : severityForPriority(after.priority),
        };
    }

    if ((before.carryCount ?? 0) !== (after.carryCount ?? 0)) {
        return {
            eventType: 'task_carried',
            title: String(after.title || 'Task carried'),
            message: `Task carry count increased to ${after.carryCount ?? 0}.`,
            severity: 'medium',
        };
    }

    return null;
}

function getGoalEvent(change: functions.Change<functions.firestore.DocumentSnapshot>): {
    eventType: string;
    title: string;
    message: string;
    severity: BehaviorSeverity;
} | null {
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;
    if (!after) return null;

    if (!before) {
        return {
            eventType: 'goal_created',
            title: String(after.title || 'Goal created'),
            message: 'A new long-term goal was created.',
            severity: severityForPriority(after.priority),
        };
    }

    if (before.status !== after.status) {
        return {
            eventType: `goal_${after.status}`,
            title: String(after.title || 'Goal status changed'),
            message: `Goal status changed from ${before.status} to ${after.status}.`,
            severity: after.status === 'completed' ? 'low' : severityForPriority(after.priority),
        };
    }

    const beforeProgress = Number(before.progress ?? 0);
    const afterProgress = Number(after.progress ?? 0);
    if (afterProgress >= beforeProgress + 10 || afterProgress === 100) {
        return {
            eventType: 'goal_progress_updated',
            title: String(after.title || 'Goal progress updated'),
            message: `Goal progress moved from ${beforeProgress}% to ${afterProgress}%.`,
            severity: 'low',
        };
    }

    return null;
}

function getReflectionEvent(change: functions.Change<functions.firestore.DocumentSnapshot>): {
    eventType: string;
    title: string;
    message: string;
    severity: BehaviorSeverity;
} | null {
    if (!change.after.exists || change.before.exists) return null;
    const after = change.after.data();
    const energy = Number(after?.energyLevel ?? 3);
    return {
        eventType: energy <= 2 ? 'reflection_low_energy' : 'reflection_logged',
        title: energy <= 2 ? 'Low energy reflection' : 'Reflection logged',
        message: energy <= 2
            ? 'Reflection indicates low execution energy.'
            : 'Daily reflection signal was captured.',
        severity: energy <= 2 ? 'medium' : 'low',
    };
}

export const onTaskWrite = functions.firestore
    .document('users/{uid}/tasks/{tid}')
    .onWrite(async (change, context) => {
        const uid = context.params.uid;
        const event = getTaskEvent(change);
        if (event) {
            await createBehaviorEvent(uid, `tasks_${context.params.tid}_${event.eventType}`, {
                source: 'tasks',
                ...event,
                metadata: {
                    taskId: context.params.tid,
                    beforeStatus: change.before.data()?.status ?? null,
                    afterStatus: change.after.data()?.status ?? null,
                },
            });
        }
        await rebuildCortexState(uid);
    });

export const onGoalWrite = functions.firestore
    .document('users/{uid}/goals/{gid}')
    .onWrite(async (change, context) => {
        const uid = context.params.uid;
        const event = getGoalEvent(change);
        if (event) {
            await createBehaviorEvent(uid, `goals_${context.params.gid}_${event.eventType}`, {
                source: 'goals',
                ...event,
                metadata: {
                    goalId: context.params.gid,
                    beforeStatus: change.before.data()?.status ?? null,
                    afterStatus: change.after.data()?.status ?? null,
                },
            });
        }
        await rebuildCortexState(uid);
    });

export const onDailyLogWrite = functions.firestore
    .document('users/{uid}/dailyLogs/{lid}')
    .onWrite(async (change, context) => {
        const uid = context.params.uid;
        const event = getReflectionEvent(change);
        if (event) {
            await createBehaviorEvent(uid, `reflection_${context.params.lid}_${event.eventType}`, {
                source: 'reflection',
                ...event,
                metadata: {
                    logId: context.params.lid,
                    energyLevel: change.after.data()?.energyLevel ?? null,
                },
            });
        }
        await rebuildCortexState(uid);
    });
