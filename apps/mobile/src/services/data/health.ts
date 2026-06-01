/**
 * Health & Recovery Data Service
 * Track sleep, water, workouts, and overall wellness
 */

import { Timestamp, where, orderBy, limit } from '../firebase';
import {
    getDocument,
    setDocument,
    queryCollection,
} from '../firebase/firestore';
import type { HealthLog } from '../../types/firestore';
import { createBehaviorEvent } from './behaviorEvents';

const COLLECTION = 'healthLogs';

/**
 * Helper to get date string
 */
const getDateId = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

/**
 * Get unique document ID
 */
const getUserDateId = (userId: string, date: Date): string => {
    return `${userId}_${getDateId(date)}`;
};

/**
 * Log daily health data
 */
export const logHealthData = async (
    userId: string,
    data: Omit<HealthLog, 'id' | 'userId' | 'date' | 'createdAt' | 'updatedAt'>
): Promise<void> => {
    const today = new Date();
    const docId = getUserDateId(userId, today);
    const routineScore = Math.round(
        Math.min(100, Math.max(0,
            (data.sleepHours >= 7 ? 25 : data.sleepHours >= 6 ? 15 : 5) +
            (data.waterGlasses >= 8 ? 20 : data.waterGlasses >= 5 ? 12 : 4) +
            (data.workoutMinutes > 0 ? 20 : data.workoutType === 'rest' ? 12 : 0) +
            (data.energyLevel * 5) +
            (data.overallHealth * 4) -
            ((data.stressLevel ?? 3) > 3 ? 8 : 0)
        ))
    );

    await setDocument<HealthLog>(`${COLLECTION}/${docId}`, {
        ...data,
        routineScore,
        userId,
        date: Timestamp.fromDate(today),
    } as Omit<HealthLog, 'id'>);

    if (data.energyLevel <= 2) {
        await createBehaviorEvent({
            source: 'health',
            eventType: 'low_energy_logged',
            severity: 'medium',
            title: 'Low energy signal',
            message: 'Energy was logged at 2/5 or lower. AltasAI should reduce execution load or recommend recovery.',
            metadata: { energyLevel: data.energyLevel, sleepHours: data.sleepHours, routineScore },
        });
    }

    if (data.workoutMinutes > 0) {
        await createBehaviorEvent({
            source: 'health',
            eventType: 'workout_completed',
            severity: 'low',
            title: 'Workout completed',
            message: 'Workout activity was logged. AltasAI can treat this as a routine consistency signal.',
            metadata: { workoutMinutes: data.workoutMinutes, workoutType: data.workoutType, routineScore },
        });
    }

    if (routineScore >= 75) {
        await createBehaviorEvent({
            source: 'health',
            eventType: 'routine_consistent',
            severity: 'low',
            title: 'Routine consistency logged',
            message: 'Health routine score is strong today. AltasAI can use this as a positive execution readiness signal.',
            metadata: { routineScore },
        });
    }
};

/**
 * Get health log for specific date
 */
export const getHealthLog = async (
    userId: string,
    date: Date
): Promise<HealthLog | null> => {
    const docId = getUserDateId(userId, date);
    return getDocument<HealthLog>(`${COLLECTION}/${docId}`);
};

/**
 * Get today's health log
 */
export const getTodaysHealth = async (userId: string): Promise<HealthLog | null> => {
    return getHealthLog(userId, new Date());
};

/**
 * Get health history
 */
export const getHealthHistory = async (
    userId: string,
    days: number = 7
): Promise<HealthLog[]> => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return queryCollection<HealthLog>(COLLECTION, [
        where('date', '>=', Timestamp.fromDate(startDate)),
        orderBy('date', 'desc'),
        limit(days),
    ]);
};

/**
 * Calculate workout streak (consecutive days with workout > 0)
 */
export const getWorkoutStreak = async (userId: string): Promise<number> => {
    const history = await getHealthHistory(userId, 30);

    let streak = 0;
    const sorted = history.sort((a, b) => b.date.toMillis() - a.date.toMillis());

    for (const log of sorted) {
        if (log.workoutMinutes > 0) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
};

/**
 * Calculate average sleep (7 days)
 */
export const getAverageSleep = async (userId: string): Promise<number> => {
    const history = await getHealthHistory(userId, 7);

    if (history.length === 0) return 0;

    const total = history.reduce((sum, log) => sum + log.sleepHours, 0);
    return Number((total / history.length).toFixed(1));
};

/**
 * Get wellness summary for AI context
 */
export const getWellnessSummary = async (userId: string): Promise<{
    avgSleep: number;
    avgWater: number;
    avgEnergy: number;
    workoutStreak: number;
    recentWorkouts: number;
}> => {
    const history = await getHealthHistory(userId, 7);

    const avgSleep = history.length > 0
        ? history.reduce((sum, l) => sum + l.sleepHours, 0) / history.length
        : 0;

    const avgWater = history.length > 0
        ? history.reduce((sum, l) => sum + l.waterGlasses, 0) / history.length
        : 0;

    const avgEnergy = history.length > 0
        ? history.reduce((sum, l) => sum + l.energyLevel, 0) / history.length
        : 0;

    const workoutStreak = await getWorkoutStreak(userId);
    const recentWorkouts = history.filter(l => l.workoutMinutes > 0).length;

    return {
        avgSleep: Number(avgSleep.toFixed(1)),
        avgWater: Math.round(avgWater),
        avgEnergy: Number(avgEnergy.toFixed(1)),
        workoutStreak,
        recentWorkouts,
    };
};
