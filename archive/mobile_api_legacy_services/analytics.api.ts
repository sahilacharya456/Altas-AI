import apiClient, { extractData } from './client';
import { API_ENDPOINTS } from '../../constants/api';

// Types
export interface AnalyticsSummary {
    today: {
        tasksCompleted: number;
        tasksTotal: number;
        completionRate: number;
        focusMinutes: number;
    };
    thisWeek: {
        tasksCompleted: number;
        tasksTotal: number;
        completionRate: number;
        reflectionsCompleted: number;
        avgMood: number;
    };
    scores: {
        discipline: number;
        productivity: number;
        consistency: number;
        overall: number;
    };
    streak: {
        current: number;
        best: number;
        type: 'reflection' | 'tasks';
    };
    trends: {
        disciplineTrend: 'up' | 'down' | 'stable';
        productivityTrend: 'up' | 'down' | 'stable';
        weekOverWeekChange: number;
    };
}

export interface DailyStats {
    date: string;
    tasksCompleted: number;
    tasksMissed: number;
    tasksCarried: number;
    focusMinutes: number;
    productivity: number;
    discipline: number;
}

// API Functions
export const analyticsApi = {
    // Get analytics summary (for dashboard)
    getSummary: async (): Promise<AnalyticsSummary> => {
        const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.SUMMARY);
        return extractData(response);
    },

    // Get daily breakdown (for charts)
    getDailyBreakdown: async (days = 30): Promise<DailyStats[]> => {
        const response = await apiClient.get(`${API_ENDPOINTS.ANALYTICS.DAILY}?days=${days}`);
        return extractData(response);
    },
};
