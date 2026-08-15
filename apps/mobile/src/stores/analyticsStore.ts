/**
 * Analytics Store - Firestore Version
 * Zustand store for dashboard analytics data
 */

import { create } from 'zustand';
import {
    getDashboardSummary,
    getChartData,
    calculateTodayAnalytics,
    calculateScoreUpdates,
} from '../services/data';
import { logger } from '../utils/logger';
import { updateScores } from '../services/data';
import { useAuthStore } from './authStore';

interface AnalyticsState {
    // State
    userId: string | null;
    dashboard: {
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
    } | null;
    chartData: {
        dates: string[];
        tasksCompleted: number[];
        disciplineScores: number[];
        focusMinutes: number[];
    } | null;
    isLoading: boolean;
    lastUpdated: Date | null;
    error: string | null;

    // Actions
    initialize: (userId: string) => void;
    loadDashboard: () => Promise<void>;
    loadChartData: (days?: number) => Promise<void>;
    refreshAll: () => Promise<void>;
    saveAnalyticsSnapshot: () => Promise<void>;
    updateUserScores: () => Promise<void>;
    clearError: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => {
    const getResolvedUserId = () => {
        let { userId } = get();
        if (!userId) {
            userId = useAuthStore.getState().user?.uid ?? null;
            if (userId) set({ userId });
        }
        return userId;
    };

    return {
    // Initial state
    userId: null,
    dashboard: null,
    chartData: null,
    isLoading: false,
    lastUpdated: null,
    error: null,

    // Initialize store with userId
    initialize: (userId: string) => {
        set({ userId });
    },

    // Load dashboard summary
    loadDashboard: async () => {
        const userId = getResolvedUserId();
        if (!userId) return;

        try {
            set({ isLoading: true, error: null });
            const dashboard = await getDashboardSummary(userId);
            set({
                dashboard,
                isLoading: false,
                lastUpdated: new Date(),
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load dashboard';
            set({ error: message, isLoading: false });
        }
    },

    // Load chart data
    loadChartData: async (days = 14) => {
        const userId = getResolvedUserId();
        if (!userId) return;

        try {
            set({ isLoading: true, error: null });
            const chartData = await getChartData(userId, days);
            set({ chartData, isLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load chart data';
            set({ error: message, isLoading: false });
        }
    },

    // Refresh all analytics
    refreshAll: async () => {
        const userId = getResolvedUserId();
        if (!userId) return;

        try {
            set({ isLoading: true, error: null });

            const [dashboard, chartData] = await Promise.all([
                getDashboardSummary(userId),
                getChartData(userId, 14),
            ]);

            set({
                dashboard,
                chartData,
                isLoading: false,
                lastUpdated: new Date(),
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to refresh analytics';
            set({ error: message, isLoading: false });
        }
    },

    // Save today's analytics snapshot
    saveAnalyticsSnapshot: async () => {
        const userId = getResolvedUserId();
        if (!userId) return;

        try {
            await calculateTodayAnalytics(userId);
        } catch (error) {
            logger.warn('Failed to save analytics snapshot', error, 'AnalyticsStore');
        }
    },

    // Calculate and update user scores
    updateUserScores: async () => {
        const userId = getResolvedUserId();
        if (!userId) return;

        try {
            const newScores = await calculateScoreUpdates(userId);
            await updateScores(newScores);

            // Refresh dashboard to show new scores
            await get().loadDashboard();
        } catch (error) {
            logger.warn('Failed to update user scores', error, 'AnalyticsStore');
        }
    },

    // Clear error
    clearError: () => set({ error: null }),
    };
});

// Selectors
export const selectDisciplineScore = (state: AnalyticsState) =>
    state.dashboard?.scores.discipline ?? 50;
export const selectProductivityScore = (state: AnalyticsState) =>
    state.dashboard?.scores.productivity ?? 50;
export const selectStreak = (state: AnalyticsState) =>
    state.dashboard?.streakDays ?? 0;
export const selectTrend = (state: AnalyticsState) =>
    state.dashboard?.week.trend ?? 'stable';
