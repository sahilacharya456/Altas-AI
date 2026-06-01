import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { db, logger } from './shared';
import { runInterventionAgent } from './ai/agents/interventionAgent';

type InterventionType = 'task' | 'goal' | 'finance' | 'health' | 'digital' | 'security' | 'reflection' | 'focus' | 'system';
type Severity = 'low' | 'medium' | 'high' | 'critical';

interface InterventionDraft {
    stableKey: string;
    type: InterventionType;
    severity: Severity;
    title: string;
    reason: string;
    recommendedAction: string;
    sourceSignals: string[];
    metadata?: Record<string, unknown>;
}

type TaskSignal = FirebaseFirestore.DocumentData & { id: string };

const nowTs = () => admin.firestore.Timestamp.now();

const expiresInDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return admin.firestore.Timestamp.fromDate(date);
};

export function getTaskOverloadSeverity(pendingCount: number): Severity {
    return pendingCount >= 10 ? 'high' : 'medium';
}

async function createIntervention(uid: string, draft: InterventionDraft): Promise<void> {
    const ref = db.doc(`users/${uid}/interventions/${draft.stableKey}`);
    const existing = await ref.get();
    if (existing.exists) {
        const data = existing.data();
        if (data?.status === 'active') return;
        const expiresAt = data?.expiresAt as admin.firestore.Timestamp | undefined;
        if (expiresAt && expiresAt.toMillis() > Date.now()) return;
    }

    let title = draft.title;
    let recommendedAction = draft.recommendedAction;

    try {
        const ai = await runInterventionAgent(uid, JSON.stringify({
            title: draft.title,
            reason: draft.reason,
            recommendedAction: draft.recommendedAction,
            sourceSignals: draft.sourceSignals,
        }));
        const first = Array.isArray(ai.output) ? ai.output[0] : null;
        if (first && !ai.offline) {
            title = first.title || title;
            recommendedAction = first.action || first.message || recommendedAction;
        }
    } catch (error) {
        logger.warn('Intervention wording fallback used', { uid, rule: draft.stableKey, error });
    }

    await ref.set({
        userId: uid,
        type: draft.type,
        severity: draft.severity,
        title,
        reason: draft.reason,
        recommendedAction,
        sourceSignals: draft.sourceSignals,
        status: 'active',
        createdAt: nowTs(),
        expiresAt: expiresInDays(2),
        metadata: draft.metadata || {},
    });
}

export async function evaluateInterventionsForUser(uid: string): Promise<void> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const [tasksSnap, logSnap, digitalSnap, budgetSnap, securitySnap] = await Promise.all([
        db.collection(`users/${uid}/tasks`)
            .where('scheduledDate', '>=', admin.firestore.Timestamp.fromDate(start))
            .where('scheduledDate', '<', admin.firestore.Timestamp.fromDate(end))
            .limit(100)
            .get(),
        db.collection(`users/${uid}/dailyLogs`)
            .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
            .where('date', '<', admin.firestore.Timestamp.fromDate(end))
            .limit(1)
            .get(),
        db.collection(`users/${uid}/digitalUsage`)
            .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
            .where('date', '<', admin.firestore.Timestamp.fromDate(end))
            .limit(1)
            .get(),
        db.collection(`users/${uid}/budgets`).orderBy('month', 'desc').limit(1).get(),
        db.collection(`users/${uid}/securityEvents`).where('resolved', '==', false).limit(10).get(),
    ]);

    const tasks = tasksSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as TaskSignal));
    const pending = tasks.filter((task) => task.status === 'pending' || task.status === 'in_progress');
    const carried = tasks.filter((task) => task.isCarried === true || Number(task.carryCount ?? 0) >= 2);
    const log = logSnap.docs[0]?.data();
    const digital = digitalSnap.docs[0]?.data();
    const budget = budgetSnap.docs[0]?.data();
    const securityEvents = securitySnap.docs.map((doc) => doc.data());

    const drafts: InterventionDraft[] = [];

    for (const task of carried.filter((item) => Number(item.carryCount ?? 0) >= 2).slice(0, 3)) {
        drafts.push({
            stableKey: `task_carry_loop_${task.id}`,
            type: 'task',
            severity: Number(task.carryCount ?? 0) >= 3 ? 'high' : 'medium',
            title: 'Break the carry loop',
            reason: `"${String(task.title)}" has been carried ${Number(task.carryCount ?? 0)} times.`,
            recommendedAction: 'Break it into a 10 minute micro-task and start a focus session.',
            sourceSignals: ['task.carryCount', 'task.status'],
            metadata: { taskId: task.id, carryCount: task.carryCount ?? 0 },
        });
    }

    if (pending.length >= 7) {
        drafts.push({
            stableKey: `overload_${start.toISOString().slice(0, 10)}`,
            type: 'task',
            severity: getTaskOverloadSeverity(pending.length),
            title: 'Task overload risk',
            reason: `${pending.length} tasks are pending or active today.`,
            recommendedAction: 'Switch to survival mode: choose top 3 tasks and defer the rest.',
            sourceSignals: ['tasks.pendingCount'],
            metadata: { pendingCount: pending.length },
        });
    }

    if (log && Number(log.energyLevel ?? 3) <= 2) {
        drafts.push({
            stableKey: `low_energy_${start.toISOString().slice(0, 10)}`,
            type: 'health',
            severity: 'medium',
            title: 'Low energy execution risk',
            reason: `Reflection energy is ${Number(log.energyLevel)}/5.`,
            recommendedAction: 'Use a lighter plan: one essential task, recovery routine, then reassess.',
            sourceSignals: ['dailyLogs.energyLevel'],
            metadata: { energyLevel: log.energyLevel },
        });
    }

    if (!log) {
        drafts.push({
            stableKey: `reflection_avoidance_${start.toISOString().slice(0, 10)}`,
            type: 'reflection',
            severity: 'low',
            title: 'Reflection signal missing',
            reason: 'No daily reflection has been logged today.',
            recommendedAction: 'Do a 2-minute honesty check before the day ends.',
            sourceSignals: ['dailyLogs.missingToday'],
        });
    }

    if (budget && Number(budget.spent ?? 0) > Number(budget.totalBudget ?? 0)) {
        drafts.push({
            stableKey: `budget_overrun_${String(budget.month ?? 'current')}`,
            type: 'finance',
            severity: 'high',
            title: 'Budget discipline risk',
            reason: `Spending ${Number(budget.spent ?? 0)} exceeds budget ${Number(budget.totalBudget ?? 0)}.`,
            recommendedAction: 'Start a 24-hour spending freeze and review top categories.',
            sourceSignals: ['budget.spent', 'budget.totalBudget'],
        });
    }

    if (digital?.exceeded) {
        drafts.push({
            stableKey: `digital_distraction_${start.toISOString().slice(0, 10)}`,
            type: 'digital',
            severity: 'medium',
            title: 'Digital distraction risk',
            reason: 'Screen time exceeded the configured goal.',
            recommendedAction: 'Start Focus Mode and block the next distraction window.',
            sourceSignals: ['digitalUsage.exceeded'],
        });
    }

    const severeSecurity = securityEvents.find((event) => event.severity === 'high' || event.severity === 'critical');
    if (severeSecurity) {
        drafts.push({
            stableKey: `security_risk_${String(severeSecurity.type ?? 'event')}`,
            type: 'security',
            severity: severeSecurity.severity === 'critical' ? 'critical' : 'high',
            title: 'Security checklist required',
            reason: String(severeSecurity.description || 'Unresolved high-severity security event detected.'),
            recommendedAction: 'Run the security checklist before continuing: verify source, avoid credentials, scan link.',
            sourceSignals: ['securityEvents.unresolved'],
        });
    }

    await Promise.all(drafts.map((draft) => createIntervention(uid, draft)));
    logger.info('Intervention rules evaluated', { uid, generatedCandidates: drafts.length });
}

const uidFromContext = (context: functions.EventContext) => String(context.params.uid);

export const onInterventionTaskWrite = functions.firestore
    .document('users/{uid}/tasks/{taskId}')
    .onWrite(async (_change, context) => evaluateInterventionsForUser(uidFromContext(context)));

export const onInterventionDailyLogWrite = functions.firestore
    .document('users/{uid}/dailyLogs/{logId}')
    .onWrite(async (_change, context) => evaluateInterventionsForUser(uidFromContext(context)));

export const onInterventionBudgetWrite = functions.firestore
    .document('users/{uid}/budgets/{budgetId}')
    .onWrite(async (_change, context) => evaluateInterventionsForUser(uidFromContext(context)));

export const onInterventionDigitalWrite = functions.firestore
    .document('users/{uid}/digitalUsage/{usageId}')
    .onWrite(async (_change, context) => evaluateInterventionsForUser(uidFromContext(context)));

export const onInterventionSecurityWrite = functions.firestore
    .document('users/{uid}/securityEvents/{eventId}')
    .onWrite(async (_change, context) => evaluateInterventionsForUser(uidFromContext(context)));
