/**
 * Daily Logs (Reflections) Data Service
 * Firestore operations for dailyLogs collection
 */

import {
    setDocument,
    getDocument,
    updateDocument,
    queryCollection,
    subscribeToDocument,
    where,
    orderBy,
    limit,
    Timestamp,
} from '../firebase';
import { DailyLog } from '../../types/firestore';

const COLLECTION = 'dailyLogs';

/**
 * Get date string in YYYY-MM-DD format
 */
const getDateId = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

/**
 * Get unique document ID for a user's daily log
 */
const getUserDateId = (userId: string, date: Date): string => {
    return `${userId}_${getDateId(date)}`;
};

/**
 * Submit a daily reflection
 */
export const submitDailyLog = async (
    userId: string,
    data: Omit<DailyLog, 'id' | 'createdAt' | 'updatedAt' | 'date' | 'userId'>
): Promise<void> => {
    const today = new Date();
    const docId = getUserDateId(userId, today);

    return setDocument<DailyLog>(`${COLLECTION}/${docId}`, {
        ...data,
        userId,
        date: Timestamp.fromDate(today),
    } as Omit<DailyLog, 'id'>);
};

/**
 * Get daily log for a specific date
 */
export const getDailyLog = async (userId: string, date: Date): Promise<DailyLog | null> => {
    const docId = getUserDateId(userId, date);
    return getDocument<DailyLog>(`${COLLECTION}/${docId}`);
};

/**
 * Get today's daily log
 */
export const getTodaysLog = async (userId: string): Promise<DailyLog | null> => {
    return getDailyLog(userId, new Date());
};

/**
 * Update a daily log (add mentor feedback, etc.)
 */
export const updateDailyLog = async (
    userId: string,
    date: Date,
    data: Partial<DailyLog>
): Promise<void> => {
    const docId = getUserDateId(userId, date);
    return updateDocument(`${COLLECTION}/${docId}`, data);
};

/**
 * Add mentor feedback to a daily log
 */
export const addMentorFeedback = async (
    userId: string,
    date: Date,
    feedback: string
): Promise<void> => {
    return updateDailyLog(userId, date, { mentorFeedback: feedback });
};

/**
 * Get daily log history
 */
export const getDailyLogHistory = async (
    userId: string,
    days: number = 30
): Promise<DailyLog[]> => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return queryCollection<DailyLog>(COLLECTION, [
        where('date', '>=', Timestamp.fromDate(startDate)),
        orderBy('date', 'desc'),
        limit(days),
    ]);
};

/**
 * Subscribe to today's log (real-time)
 */
export const subscribeToTodaysLog = (
    userId: string,
    callback: (log: DailyLog | null) => void
): (() => void) => {
    const docId = getUserDateId(userId, new Date());
    return subscribeToDocument<DailyLog>(`${COLLECTION}/${docId}`, callback);
};

/**
 * Calculate reflection streak
 */
export const getReflectionStreak = async (userId: string): Promise<number> => {
    const logs = await getDailyLogHistory(userId, 60);

    if (logs.length === 0) return 0;

    let streak = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const logDateStrings = new Set(
        logs.map(l => getDateId(l.date.toDate()))
    );

    const todayStr = getDateId(now);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getDateId(yesterday);

    // If neither today nor yesterday has a log, streak is broken
    if (!logDateStrings.has(todayStr) && !logDateStrings.has(yesterdayStr)) {
        return 0;
    }

    let currentDate = new Date(now);

    // If today is logged, start counting from today
    if (logDateStrings.has(todayStr)) {
        currentDate = now;
    } else {
        // If today not logged but yesterday is, start from yesterday
        currentDate = yesterday;
    }

    // Bounded by 60 days (the history window fetched above)
    for (let day = 0; day < 60; day++) {
        const dateStr = getDateId(currentDate);
        if (logDateStrings.has(dateStr)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
};

/**
 * Get average mood for past N days
 */
export const getAverageMood = async (userId: string, days: number = 7): Promise<number> => {
    const logs = await getDailyLogHistory(userId, days);

    if (logs.length === 0) return 0;

    const total = logs.reduce((sum, log) => sum + log.mood, 0);
    return Math.round((total / logs.length) * 10) / 10;
};
