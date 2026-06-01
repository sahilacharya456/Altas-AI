import * as admin from 'firebase-admin';
import { db } from '../shared';

export interface SafeMemoryContext {
    profile: {
        displayName: string;
        disciplineLevel: string;
        scores: Record<string, number>;
    };
    tasks: {
        totalToday: number;
        pending: string[];
        carried: string[];
        completedCount: number;
    };
    goals: string[];
    reflections: {
        recentCount: number;
        latestEnergy?: number;
        latestMood?: number;
    };
    cortex: {
        executionRiskScore?: number;
        riskLevel?: string;
        reasons?: string[];
        recommendedAction?: string;
    };
    behaviorEvents: string[];
    financeSummary?: string;
    securitySummary?: string;
}

export async function retrieveSafeMemory(userId: string): Promise<SafeMemoryContext> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const [profileDoc, tasksSnap, goalsSnap, logsSnap, riskDoc, eventsSnap, budgetSnap, securitySnap] = await Promise.all([
        db.doc(`users/${userId}/profile/data`).get(),
        db.collection(`users/${userId}/tasks`)
            .where('scheduledDate', '>=', admin.firestore.Timestamp.fromDate(start))
            .where('scheduledDate', '<', admin.firestore.Timestamp.fromDate(end))
            .limit(30)
            .get(),
        db.collection(`users/${userId}/goals`).where('status', '==', 'active').limit(5).get(),
        db.collection(`users/${userId}/dailyLogs`)
            .where('date', '>=', admin.firestore.Timestamp.fromDate(twoWeeksAgo))
            .orderBy('date', 'desc')
            .limit(7)
            .get(),
        db.doc(`users/${userId}/cortex/riskState`).get(),
        db.collection(`users/${userId}/behaviorEvents`).orderBy('createdAt', 'desc').limit(8).get(),
        db.collection(`users/${userId}/budgets`).orderBy('month', 'desc').limit(1).get(),
        db.collection(`users/${userId}/securityEvents`).where('resolved', '==', false).limit(5).get(),
    ]);

    const profile = profileDoc.data();
    const tasks = tasksSnap.docs.map((doc) => doc.data());
    const logs = logsSnap.docs.map((doc) => doc.data());
    const risk = riskDoc.data();
    const budget = budgetSnap.docs[0]?.data();
    const securityCount = securitySnap.size;

    return {
        profile: {
            displayName: String(profile?.displayName ?? 'User'),
            disciplineLevel: String(profile?.disciplineLevel ?? 'strict'),
            scores: profile?.currentScores ?? {},
        },
        tasks: {
            totalToday: tasks.length,
            pending: tasks.filter((task) => task.status === 'pending' || task.status === 'in_progress').slice(0, 5).map((task) => String(task.title)),
            carried: tasks.filter((task) => task.isCarried || task.status === 'carried').slice(0, 5).map((task) => String(task.title)),
            completedCount: tasks.filter((task) => task.status === 'completed').length,
        },
        goals: goalsSnap.docs.map((doc) => String(doc.data().title)).slice(0, 5),
        reflections: {
            recentCount: logs.length,
            latestEnergy: logs[0]?.energyLevel,
            latestMood: logs[0]?.mood,
        },
        cortex: {
            executionRiskScore: risk?.executionRiskScore,
            riskLevel: risk?.riskLevel,
            reasons: risk?.reasons,
            recommendedAction: risk?.recommendedAction,
        },
        behaviorEvents: eventsSnap.docs.map((doc) => {
            const event = doc.data();
            return `${event.source}:${event.eventType}:${event.title}`;
        }),
        financeSummary: budget ? `Budget spent ${budget.spent ?? 0} of ${budget.totalBudget ?? 0}` : undefined,
        securitySummary: securityCount ? `${securityCount} unresolved security events` : 'No unresolved security events',
    };
}

export function summarizeMemory(context: SafeMemoryContext): string {
    return JSON.stringify(context, null, 2).slice(0, 5000);
}
