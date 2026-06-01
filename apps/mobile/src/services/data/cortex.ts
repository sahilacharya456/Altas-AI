import { getDocument, queryCollection, orderBy, limit, Timestamp } from '../firebase';
import type { BehaviorEvent, CortexRiskState, Task } from '../../types/firestore';
import { getTasksForDate } from './tasks';
import { getTodaysLog } from './dailyLogs';
import { getTodaysUsage } from './digitalUsage';
import { getCurrentBudget } from './budget';
import { getUnresolvedEvents } from './security';

export const getCortexRiskState = async (userId: string): Promise<CortexRiskState> => {
    const serverState = await getDocument<CortexRiskState>('cortex/riskState');
    if (serverState) return serverState;

    return calculateLocalRiskState(userId);
};

export const getCortexDocument = async <T>(documentId: 'daily' | 'weekly' | 'patterns'): Promise<T | null> => {
    return getDocument<T & { id?: string }>(`cortex/${documentId}`) as Promise<T | null>;
};

export const getRecentCortexEvents = async (userId: string, count = 20): Promise<BehaviorEvent[]> => {
    return queryCollection<BehaviorEvent>('behaviorEvents', [
        orderBy('createdAt', 'desc'),
        limit(count),
    ]);
};

export const calculateLocalRiskState = async (userId: string): Promise<CortexRiskState> => {
    const today = new Date();
    const [tasks, todaysLog, digitalUsage, budget, securityEvents] = await Promise.all([
        getTasksForDate(userId, today).catch(() => [] as Task[]),
        getTodaysLog(userId).catch(() => null),
        getTodaysUsage(userId).catch(() => null),
        getCurrentBudget(userId).catch(() => null),
        getUnresolvedEvents().catch(() => []),
    ]);

    const now = Date.now();
    const pendingTaskCount = tasks.filter((task) => task.status === 'pending' || task.status === 'in_progress').length;
    const carriedTaskCount = tasks.filter((task) => task.isCarried || task.status === 'carried').length;
    const missedOrOverdueTaskCount = tasks.filter((task) => {
        const date = task.scheduledDate?.toDate?.();
        return date && date.getTime() < now && task.status !== 'completed' && task.status !== 'cancelled';
    }).length;
    const lowEnergy = Boolean(todaysLog && todaysLog.energyLevel <= 2);
    const missedReflection = !todaysLog;
    const highDigitalUsage = Boolean(digitalUsage?.exceeded);
    const budgetRisk = Boolean(budget && budget.spent > budget.totalBudget);
    const securityRisk = securityEvents.some((event) => event.severity === 'high' || event.severity === 'critical');

    const reasons: string[] = [];
    let score = 0;

    if (pendingTaskCount >= 6) {
        score += 18;
        reasons.push(`${pendingTaskCount} tasks are still pending or active.`);
    } else if (pendingTaskCount >= 3) {
        score += 10;
        reasons.push(`${pendingTaskCount} tasks still need execution.`);
    }

    if (carriedTaskCount > 0) {
        score += Math.min(24, carriedTaskCount * 8);
        reasons.push(`${carriedTaskCount} carried task${carriedTaskCount === 1 ? '' : 's'} indicate execution debt.`);
    }

    if (missedOrOverdueTaskCount > 0) {
        score += Math.min(24, missedOrOverdueTaskCount * 8);
        reasons.push(`${missedOrOverdueTaskCount} task${missedOrOverdueTaskCount === 1 ? ' is' : 's are'} overdue today.`);
    }

    if (lowEnergy) {
        score += 16;
        reasons.push('Reflection energy is low.');
    }

    if (missedReflection) {
        score += 8;
        reasons.push('No reflection signal has been logged today.');
    }

    if (highDigitalUsage) {
        score += 12;
        reasons.push('Digital usage is above the configured goal.');
    }

    if (budgetRisk) {
        score += 10;
        reasons.push('Budget usage is above the configured limit.');
    }

    if (securityRisk) {
        score += 16;
        reasons.push('Unresolved high-severity security risk exists.');
    }

    const executionRiskScore = Math.min(100, score);
    const riskLevel = executionRiskScore >= 80
        ? 'critical'
        : executionRiskScore >= 55
            ? 'high'
            : executionRiskScore >= 30
                ? 'medium'
                : 'low';

    return {
        userId,
        executionRiskScore,
        riskLevel,
        reasons: reasons.length ? reasons : ['No major deterministic risk signal detected.'],
        recommendedAction: getRecommendedAction(riskLevel, reasons),
        updatedAt: Timestamp.now(),
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
};

const getRecommendedAction = (
    riskLevel: CortexRiskState['riskLevel'],
    reasons: string[]
) => {
    if (riskLevel === 'critical') return 'Stop adding work. Clear one overdue or carried task immediately.';
    if (riskLevel === 'high') return 'Pick the highest-risk task and run one focused execution block.';
    if (reasons.some((reason) => reason.includes('reflection'))) return 'Log a short reflection to restore behavior signal quality.';
    return 'Maintain the current plan and protect the next focus block.';
};
