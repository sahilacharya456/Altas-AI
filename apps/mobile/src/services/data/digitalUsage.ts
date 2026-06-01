/**
 * Digital Discipline / Phone Usage Data Service
 * Track and manage screen time
 */

import { Timestamp, where, orderBy, limit } from '../firebase';
import {
    getDocument,
    setDocument,
    queryCollection,
    subscribeToDocument,
} from '../firebase/firestore';
import type { DigitalUsage } from '../../types/firestore';
import { createBehaviorEvent } from './behaviorEvents';

const COLLECTION = 'digitalUsage';

/**
 * Helper to get date string (YYYY-MM-DD)
 */
const getDateId = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

/**
 * Get unique document ID for a user's digital usage
 */
const getUserDateId = (userId: string, date: Date): string => {
    return `${userId}_${getDateId(date)}`;
};

/**
 * Log daily screen time
 */
export const logDigitalUsage = async (
    userId: string,
    data: Omit<DigitalUsage, 'id' | 'userId' | 'date' | 'exceeded' | 'createdAt' | 'updatedAt'>
): Promise<void> => {
    const today = new Date();
    const docId = getUserDateId(userId, today);

    const exceeded = data.screenMinutes > data.goalMinutes;
    const distractionScore = Math.min(100, Math.round((data.screenMinutes / Math.max(data.goalMinutes, 1)) * 70));

    await setDocument<DigitalUsage>(`${COLLECTION}/${docId}`, {
        ...data,
        userId,
        date: Timestamp.fromDate(today),
        exceeded,
        distractionScore,
    } as Omit<DigitalUsage, 'id'>);

    if (exceeded) {
        await createBehaviorEvent({
            source: 'digital',
            eventType: 'digital_goal_exceeded',
            severity: distractionScore >= 90 ? 'high' : 'medium',
            title: 'Digital usage above goal',
            message: 'Screen usage exceeded the daily goal. AltasAI should recommend focus protection.',
            metadata: {
                screenMinutes: data.screenMinutes,
                goalMinutes: data.goalMinutes,
                distractionScore,
                appCategory: data.appCategory ?? 'other',
            },
        });
    }
};

/**
 * Get digital usage for a specific date
 */
export const getDigitalUsage = async (
    userId: string,
    date: Date
): Promise<DigitalUsage | null> => {
    const docId = getUserDateId(userId, date);
    return getDocument<DigitalUsage>(`${COLLECTION}/${docId}`);
};

/**
 * Get today's digital usage
 */
export const getTodaysUsage = async (userId: string): Promise<DigitalUsage | null> => {
    return getDigitalUsage(userId, new Date());
};

/**
 * Get usage history
 */
export const getUsageHistory = async (
    userId: string,
    days: number = 7
): Promise<DigitalUsage[]> => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return queryCollection<DigitalUsage>(COLLECTION, [
        where('date', '>=', Timestamp.fromDate(startDate)),
        orderBy('date', 'desc'),
        limit(days),
    ]);
};

/**
 * Calculate streak (days under goal)
 */
export const getUnderGoalStreak = async (userId: string): Promise<number> => {
    const history = await getUsageHistory(userId, 30); // Check last 30 days

    let streak = 0;
    const sortedHistory = history.sort((a, b) =>
        b.date.toMillis() - a.date.toMillis()
    );

    for (const usage of sortedHistory) {
        if (!usage.exceeded) {
            streak++;
        } else {
            break; // Streak broken
        }
    }

    return streak;
};

/**
 * Get weekly average screen time
 */
export const getWeeklyAverage = async (userId: string): Promise<number> => {
    const history = await getUsageHistory(userId, 7);

    if (history.length === 0) return 0;

    const totalMinutes = history.reduce((sum, usage) => sum + usage.screenMinutes, 0);
    return Math.round(totalMinutes / history.length);
};

/**
 * Subscribe to today's usage
 */
export const subscribeToTodaysUsage = (
    userId: string,
    callback: (usage: DigitalUsage | null) => void
): (() => void) => {
    const docId = getUserDateId(userId, new Date());
    return subscribeToDocument<DigitalUsage>(`${COLLECTION}/${docId}`, callback);
};

/**
 * Get digital discipline summary for AI context
 */
export const getDigitalSummary = async (userId: string): Promise<{
    todayMinutes: number;
    weeklyAverage: number;
    streak: number;
    goalMinutes: number;
    underGoal: boolean;
}> => {
    const today = await getTodaysUsage(userId);
    const weeklyAvg = await getWeeklyAverage(userId);
    const streak = await getUnderGoalStreak(userId);

    return {
        todayMinutes: today?.screenMinutes || 0,
        weeklyAverage: weeklyAvg,
        streak,
        goalMinutes: today?.goalMinutes || 240, // Default 4 hours
        underGoal: today ? !today.exceeded : true,
    };
};
