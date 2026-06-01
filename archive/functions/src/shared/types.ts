import * as admin from 'firebase-admin';

export interface BehaviorPatterns {
    completionTrend: number;
    trendDirection: 'improving' | 'declining' | 'stable' | 'unknown';
    topExcuse: string;
    excuseCount: number;
    reflectionStreak: number;
    averageMood: string;
    energyTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface BudgetInsight {
    type: 'info' | 'warning' | 'critical' | 'encouragement';
    message: string;
    action: string;
}

export interface CortexStateData {
    profileName: string;
    disciplineLevel: string;
    disciplineScore: number;
    completedToday: number;
    totalToday: number;
    carriedCount: number;
    carriedTitles: string[];
    activeGoalCount: number;
    urgentGoals: { title: string; daysLeft: number }[];
    patterns: BehaviorPatterns;
    lastUpdated: admin.firestore.Timestamp;
}

export interface Intervention {
    userId: string;
    source: 'cortex' | 'mentor' | 'budget' | 'security' | 'reflection' | 'system';
    type: 'nudge' | 'warning' | 'plan_adjustment' | 'lockdown' | 'recovery' | 'report';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'delivered' | 'acted' | 'dismissed' | 'expired';
    createdAt: admin.firestore.Timestamp;
    metadata?: Record<string, unknown>;
}

export interface AIReport {
    userId: string;
    type: 'daily' | 'weekly' | 'monthly' | 'incident' | 'custom';
    title: string;
    summary: string;
    insights: string[];
    actions: string[];
    generatedAt: admin.firestore.Timestamp;
    model?: string;
}
