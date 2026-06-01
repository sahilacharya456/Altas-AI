/**
 * Analytics Data Service
 * Firestore operations for analytics and dashboard data
 */

import {
    setDocument,
    getDocument,
    queryCollection,
    where,
    orderBy,
    limit,
    Timestamp,
} from '../firebase';
import { AnalyticsSnapshot } from '../../types/firestore';
import { getTaskSummary, getTasksForDate } from './tasks';
import { getReflectionStreak } from './dailyLogs';
import { getProfile } from './profile';

const COLLECTION = 'analytics';

/**
 * Get date string in YYYY-MM-DD format
 */
const getDateId = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

/**
 * Get unique document ID for a user's analytics snapshot
 */
const getUserDateId = (userId: string, date: Date): string => {
    return `${userId}_${getDateId(date)}`;
};

/**
 * Get or calculate today's analytics snapshot
 */
export const getTodaySnapshot = async (userId: string): Promise<AnalyticsSnapshot | null> => {
    const docId = getUserDateId(userId, new Date());
    return getDocument<AnalyticsSnapshot>(`${COLLECTION}/${docId}`);
};

/**
 * Save analytics snapshot for a date
 */
export const saveSnapshot = async (
    userId: string,
    date: Date,
    data: Omit<AnalyticsSnapshot, 'id' | 'date' | 'userId'>
): Promise<void> => {
    const docId = getUserDateId(userId, date);
    return setDocument<AnalyticsSnapshot>(`${COLLECTION}/${docId}`, {
        ...data,
        userId,
        date: Timestamp.fromDate(date),
    } as Omit<AnalyticsSnapshot, 'id'>);
};

/**
 * Get analytics history for charting
 */
export const getAnalyticsHistory = async (
    userId: string,
    days: number = 30
): Promise<AnalyticsSnapshot[]> => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return queryCollection<AnalyticsSnapshot>(COLLECTION, [
        where('date', '>=', Timestamp.fromDate(startDate)),
        orderBy('date', 'desc'),
        limit(days),
    ]);
};

/**
 * Calculate and save analytics for today
 */
export const calculateTodayAnalytics = async (userId: string): Promise<AnalyticsSnapshot> => {
    const today = new Date();
    const profile = await getProfile();
    const taskSummary = await getTaskSummary(userId, today);
    const streak = await getReflectionStreak(userId);

    // Get today's tasks for focus minutes calculation
    const tasks = await getTasksForDate(userId, today);
    const focusMinutes = tasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.actualMinutes || t.estimatedMinutes || 0), 0);

    const snapshot: Omit<AnalyticsSnapshot, 'id' | 'date' | 'userId'> = {
        tasksCompleted: taskSummary.completed,
        tasksMissed: taskSummary.pending + (taskSummary.carried || 0),
        tasksCarried: taskSummary.carried || 0,
        focusMinutes,
        disciplineScore: profile?.currentScores?.discipline || 50,
        productivityScore: profile?.currentScores?.productivity || 50,
        consistencyScore: profile?.currentScores?.consistency || 50,
        streakDays: streak,
    };

    await saveSnapshot(userId, today, snapshot);

    return {
        id: getUserDateId(userId, today),
        userId,
        date: Timestamp.fromDate(today),
        ...snapshot,
    };
};

/**
 * Get dashboard summary data
 */
export const getDashboardSummary = async (userId: string): Promise<{
    today: {
        tasksCompleted: number;
        tasksPending: number;
        focusMinutes: number;
        completionRate: number;
    };
    week: {
        avgTasksCompleted: number;
        avgFocusMinutes: number;
        trend: 'up' | 'down' | 'stable';
    };
    scores: {
        discipline: number;
        productivity: number;
        consistency: number;
    };
    streakDays: number;
}> => {
    const today = new Date();
    const [profileResult, todaySummaryResult, streakResult, weekHistoryResult, tasksResult] = await Promise.allSettled([
        getProfile(),
        getTaskSummary(userId, today),
        getReflectionStreak(userId),
        getAnalyticsHistory(userId, 7),
        getTasksForDate(userId, today),
    ]);

    const profile = profileResult.status === 'fulfilled' ? profileResult.value : null;
    const todaySummary = todaySummaryResult.status === 'fulfilled'
        ? todaySummaryResult.value
        : { total: 0, completed: 0, pending: 0, carried: 0, completionRate: 0 };
    const streak = streakResult.status === 'fulfilled' ? streakResult.value : 0;
    const weekHistory = weekHistoryResult.status === 'fulfilled' ? weekHistoryResult.value : [];
    const tasks = tasksResult.status === 'fulfilled' ? tasksResult.value : [];

    // Calculate weekly averages
    const avgTasksCompleted = weekHistory.length > 0
        ? Math.round(weekHistory.reduce((sum, d) => sum + d.tasksCompleted, 0) / weekHistory.length)
        : 0;

    const avgFocusMinutes = weekHistory.length > 0
        ? Math.round(weekHistory.reduce((sum, d) => sum + d.focusMinutes, 0) / weekHistory.length)
        : 0;

    // Calculate trend (compare this week to last week)
    const thisWeekTasks = weekHistory.slice(0, 4).reduce((sum, d) => sum + d.tasksCompleted, 0);
    const lastWeekTasks = weekHistory.slice(4, 7).reduce((sum, d) => sum + d.tasksCompleted, 0);
    const trend: 'up' | 'down' | 'stable' =
        thisWeekTasks > lastWeekTasks * 1.1 ? 'up' :
            thisWeekTasks < lastWeekTasks * 0.9 ? 'down' : 'stable';

    // Calculate today's focus minutes
    const focusMinutes = tasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.actualMinutes || t.estimatedMinutes || 0), 0);

    return {
        today: {
            tasksCompleted: todaySummary.completed,
            tasksPending: todaySummary.pending,
            focusMinutes,
            completionRate: todaySummary.completionRate,
        },
        week: {
            avgTasksCompleted,
            avgFocusMinutes,
            trend,
        },
        scores: {
            discipline: profile?.currentScores?.discipline || 50,
            productivity: profile?.currentScores?.productivity || 50,
            consistency: profile?.currentScores?.consistency || 50,
        },
        streakDays: streak,
    };
};

/**
 * Get data for charts (last N days)
 */
export const getChartData = async (
    userId: string,
    days: number = 14
): Promise<{
    dates: string[];
    tasksCompleted: number[];
    disciplineScores: number[];
    focusMinutes: number[];
}> => {
    const history = await getAnalyticsHistory(userId, days);

    // Fill in missing dates with zeros
    const dates: string[] = [];
    const tasksCompleted: number[] = [];
    const disciplineScores: number[] = [];
    const focusMinutes: number[] = [];

    const historyMap = new Map(history.map(h => [getDateId(h.date.toDate()), h]));

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateId = getDateId(date);

        dates.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

        const snapshot = historyMap.get(dateId);
        tasksCompleted.push(snapshot?.tasksCompleted || 0);
        disciplineScores.push(snapshot?.disciplineScore || 50);
        focusMinutes.push(snapshot?.focusMinutes || 0);
    }

    return { dates, tasksCompleted, disciplineScores, focusMinutes };
};

/**
 * Calculate score updates based on daily activity
 */
export const calculateScoreUpdates = async (userId: string): Promise<{
    discipline: number;
    productivity: number;
    consistency: number;
}> => {
    // Parallelize all independent fetches
    const [profile, todaySummary, streak, tasks] = await Promise.all([
        getProfile(),
        getTaskSummary(userId, new Date()),
        getReflectionStreak(userId),
        getTasksForDate(userId, new Date()),
    ]);

    const currentScores = profile?.currentScores || { discipline: 50, productivity: 50, consistency: 50 };

    // Discipline: based on task completion and carries
    const disciplineDelta =
        todaySummary.completionRate >= 80 ? 2 :
            todaySummary.completionRate >= 50 ? 0 :
                todaySummary.carried > 2 ? -3 : -1;

    const focusMinutes = tasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.actualMinutes || t.estimatedMinutes || 0), 0);

    const productivityDelta =
        focusMinutes >= 240 ? 2 :  // 4+ hours
            focusMinutes >= 120 ? 1 :  // 2+ hours
                focusMinutes < 30 ? -2 : 0;

    // Consistency: based on streak
    const consistencyDelta =
        streak >= 7 ? 2 :
            streak >= 3 ? 1 :
                streak === 0 ? -2 : 0;

    return {
        discipline: Math.min(100, Math.max(0, currentScores.discipline + disciplineDelta)),
        productivity: Math.min(100, Math.max(0, currentScores.productivity + productivityDelta)),
        consistency: Math.min(100, Math.max(0, currentScores.consistency + consistencyDelta)),
    };
};
