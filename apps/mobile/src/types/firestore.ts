/**
 * Firestore Data Types for Ultra-CI
 * These match the Firestore document schemas
 */

import { Timestamp } from 'firebase/firestore';

// User Profile
export interface UserProfile {
    id?: string;
    email: string;
    displayName: string;
    createdAt: Timestamp;
    disciplineLevel: 'mentor' | 'strict' | 'ruthless';
    focusAreas: ('career' | 'health' | 'fitness' | 'study' | 'personal')[];
    lifeRhythm: {
        wakeTime: string;
        sleepTime: string;
        workStartTime?: string;
        workEndTime?: string;
        timezone?: string;
    };
    currentScores: {
        discipline: number;
        productivity: number;
        consistency: number;
    };
    onboardingCompleted: boolean;
    updatedAt?: Timestamp;
}

// Task
export interface Task {
    id?: string;
    userId: string;
    title: string;
    description?: string;
    category: 'career' | 'health' | 'fitness' | 'study' | 'personal' | 'routine';
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'in_progress' | 'completed' | 'carried' | 'cancelled';
    scheduledDate: Timestamp;
    estimatedMinutes: number;
    actualMinutes?: number;
    tags?: string[];

    // Carry system
    isCarried: boolean;
    carryCount: number;
    originalDate?: Timestamp;
    carriedFrom?: string;

    // Timestamps
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    completedAt?: Timestamp;
    startedAt?: Timestamp;
    source?: 'manual' | 'goal' | 'AI' | 'intervention';
    context?: string;
    goalId?: string;
    focusSessionIds?: string[];
}

// Goal
export interface Goal {
    id?: string;
    userId: string;
    title: string;
    description?: string;
    category: 'career' | 'health' | 'fitness' | 'study' | 'personal';
    priority: 'low' | 'medium' | 'high' | 'critical';
    targetDate: Timestamp;
    status: 'active' | 'paused' | 'completed' | 'abandoned';
    progress: number; // 0-100
    milestones?: {
        title: string;
        completed: boolean;
        completedAt?: Timestamp;
    }[];
    aiBreakdown?: string[];
    linkedTaskIds?: string[];
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

// Daily Log (Reflection)
export interface DailyLog {
    id?: string;
    userId: string; // Added for multi-tenancy
    date: Timestamp;
    mood: 1 | 2 | 3 | 4 | 5;
    energyLevel: 1 | 2 | 3 | 4 | 5;
    wins: string[];
    struggles: string[];
    excusesMade?: string[];
    honestAssessment: string;
    tomorrowPriority?: string;

    // Task stats (denormalized)
    tasksCompleted: number;
    tasksMissed: number;
    tasksCarried: number;
    focusMinutes: number;

    // AI feedback
    mentorFeedback?: string;

    // Scores
    productivityScore?: number;
    disciplineScore?: number;

    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

// AI Feedback
export interface AIFeedback {
    id?: string;
    type: 'morning' | 'task_review' | 'reflection' | 'general';
    prompt: string;
    response: string;
    model: string;
    createdAt: Timestamp;
}

// Analytics Snapshot
export interface AnalyticsSnapshot {
    id?: string; // date string YYYY-MM-DD
    userId: string; // Added for multi-tenancy
    date: Timestamp;
    tasksCompleted: number;
    tasksMissed: number;
    tasksCarried: number;
    focusMinutes: number;
    disciplineScore: number;
    productivityScore: number;
    consistencyScore: number;
    streakDays: number;
}

/**
 * Digital Discipline / Phone Usage
 */
export interface DigitalUsage {
    id: string;
    userId: string;
    date: Timestamp;
    screenMinutes: number; // Total daily screen time (0-720, max 12 hours)
    topApps?: Array<{
        name: string;
        minutes: number;
        category?: 'social' | 'entertainment' | 'work' | 'study' | 'finance' | 'health' | 'security' | 'other';
    }>; // Optional: Top 3 apps
    appCategory?: 'social' | 'entertainment' | 'work' | 'study' | 'finance' | 'health' | 'security' | 'other';
    goalMinutes: number; // User's daily screen time goal
    exceeded: boolean; // true if screenMinutes > goalMinutes
    distractionScore?: number; // 0-100, higher means more distraction risk
    notes?: string; // Optional reflection
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * Health & Recovery Tracking
 */
export interface HealthLog {
    id: string;
    userId: string;
    date: Timestamp;
    sleepHours: number; // 0-12
    waterGlasses: number; // 0-20
    workoutMinutes: number; // 0-180
    workoutType: 'cardio' | 'strength' | 'yoga' | 'rest' | 'other';
    energyLevel: number; // 1-5
    overallHealth: number; // 1-5 (how body feels)
    stressLevel?: number; // 1-5, self-reported stress without medical claims
    routineScore?: number; // 0-100, deterministic lifestyle consistency score
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * Smart Khata - Expense Tracking
 */
export type ExpenseCategory = 'food' | 'transport' | 'study' | 'rent' | 'entertainment' | 'misc';

export interface Expense {
    id: string;
    userId: string;
    amount: number;
    category: ExpenseCategory;
    note?: string;
    date: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * Smart Khata - Borrow/Lend Ledger
 */
export interface KhataEntry {
    id: string;
    userId: string;
    personName: string;
    amount: number;
    type: 'borrowed' | 'lent';
    dueDate?: Timestamp;
    status: 'pending' | 'partial' | 'settled';
    amountSettled: number;
    note?: string;
    settledAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * Smart Khata - Monthly Budget
 */
export interface MonthlyBudget {
    id: string;
    userId: string;
    month: string;
    totalBudget: number;
    categoryLimits?: {
        food?: number;
        transport?: number;
        study?: number;
        rent?: number;
        entertainment?: number;
    };
    spent: number;
    categorySpent: {
        food: number;
        transport: number;
        study: number;
        rent: number;
        entertainment: number;
        misc: number;
    };
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * Smart Khata - Budget AI Alerts
 */
export interface BudgetAlert {
    id: string;
    userId: string;
    type: 'overspend' | 'category_limit' | 'spike' | 'borrow_pattern' | 'encouragement';
    message: string;
    severity: 'info' | 'warning' | 'critical';
    read: boolean;
    createdAt: Timestamp;
}

/**
 * AltasAI Shield - Security Data Models
 */

// Security Scan Result
export interface SecurityScan {
    id: string;
    userId: string;
    type: 'url' | 'text' | 'permission';
    input: string; // URL or text (hashed if sensitive)
    result: {
        isThreat: boolean;
        riskScore: number; // 0-100
        confidence: number; // 0-1
        reasons: string[];
        recommendation: string;
    };
    scanDate: Timestamp;
    userAction?: 'blocked' | 'proceeded' | 'reported';
}

// Link Analysis (Cached)
export interface LinkAnalysis {
    id: string;
    userId: string;
    urlHash: string; // SHA-256 hash for privacy
    domain: string;
    analysis: {
        phishingProb: number;
        features: Record<string, number>;
        verdict: 'safe' | 'suspicious' | 'phishing';
    };
    createdAt: Timestamp;
    expiresAt: Timestamp; // TTL for cleanup
}

// Device Risk Report
export interface DeviceRiskReport {
    id: string;
    userId: string;
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number; // 0-100
    apps: Array<{
        packageName: string;
        appName: string;
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
        reasons: string[];
    }>;
    generatedAt: Timestamp;
}

// Security Mentor Conversation Log
export interface SecurityMentorLog {
    id: string;
    userId: string;
    query: string;
    response: string;
    scanResult?: any;
    timestamp: Timestamp;
}

// Security Event
export interface SecurityEvent {
    id?: string;
    userId?: string;
    type: 'phishing_attempt' | 'suspicious_url' | 'behavior_alert';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    metadata?: Record<string, unknown>;
    resolved: boolean;
    createdAt: Timestamp;
}

/**
 * Behavior Events power the long-term Signals -> Cortex loop.
 * They are intentionally generic so tasks, finance, health, digital usage,
 * and security can emit comparable events without each module inventing a
 * separate telemetry shape.
 */
export interface BehaviorEvent {
    id?: string;
    userId: string;
    source: 'tasks' | 'goals' | 'reflection' | 'finance' | 'health' | 'digital' | 'security' | 'focus' | 'mentor' | 'system';
    eventType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
    createdAt: Timestamp;
    occurredAt?: Timestamp;
    signalStrength?: number; // 0-100 compatibility field for older Cortex scoring.
}

export interface FocusSession {
    id?: string;
    userId: string;
    taskId: string;
    goalId?: string;
    startedAt: Timestamp;
    endedAt?: Timestamp;
    durationMinutes: number;
    plannedMinutes?: number;
    status: 'active' | 'paused' | 'completed' | 'cancelled';
    quality?: 1 | 2 | 3 | 4 | 5;
    notes?: string;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

export interface CortexSummary {
    id?: string;
    userId: string;
    generatedAt: Timestamp;
    executionRisk: number; // 0-100
    disciplineScore: number;
    primarySignals: string[];
    riskFactors: string[];
    recommendedInterventions: string[];
    staleAfter: Timestamp;
}

export interface CortexRiskState {
    id?: string;
    userId: string;
    executionRiskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    reasons: string[];
    recommendedAction: string;
    updatedAt: Timestamp;
    signalSnapshot: {
        pendingTaskCount: number;
        carriedTaskCount: number;
        missedOrOverdueTaskCount: number;
        lowEnergy: boolean;
        missedReflection: boolean;
        highDigitalUsage: boolean;
        budgetRisk: boolean;
        securityRisk: boolean;
    };
}

export interface Intervention {
    id?: string;
    userId: string;
    type: 'task' | 'goal' | 'finance' | 'health' | 'digital' | 'security' | 'reflection' | 'focus' | 'system';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    reason: string;
    recommendedAction: string;
    sourceSignals: string[];
    status: 'active' | 'accepted' | 'ignored' | 'completed' | 'expired';
    targetRoute?: string;
    createdAt: Timestamp;
    completedAt?: Timestamp;
    expiresAt?: Timestamp;
    metadata?: Record<string, unknown>;
}

export interface AIReport {
    id?: string;
    userId: string;
    type: 'daily' | 'weekly' | 'monthly' | 'incident' | 'custom';
    title: string;
    summary: string;
    insights: string[];
    actions: string[];
    scoreSnapshot: {
        discipline: number;
        productivity: number;
        consistency: number;
        executionRisk?: number;
    };
    generatedAt: Timestamp;
    model?: string;
    sourceCollectionRefs?: string[];
}

export type ReportType = 'daily' | 'weekly' | 'monthly';

export interface ReportChartPoint {
    label: string;
    value: number;
    secondaryValue?: number;
}

export interface ReportMetrics {
    disciplineScore: number;
    executionRate: number;
    completedTasks: number;
    missedTasks: number;
    carriedTasks: number;
    focusMinutes: number;
    goalProgress: number;
    reflectionConsistency: number;
    moodAverage: number;
    energyAverage: number;
}

export interface AltasAIReport {
    id?: string;
    userId: string;
    type: ReportType;
    title: string;
    summary: string;
    periodStart: Timestamp;
    periodEnd: Timestamp;
    metrics: ReportMetrics;
    charts: {
        executionRate: ReportChartPoint[];
        disciplineScore: ReportChartPoint[];
        focusMinutes: ReportChartPoint[];
        carriedTasks: ReportChartPoint[];
        moodEnergy: ReportChartPoint[];
    };
    priorities: string[];
    riskReasons: string[];
    recommendedFocusWindow: string;
    strictMentorMessage: string;
    warnings: string[];
    biggestWeakness: string;
    biggestWin: string;
    nextPlan: string[];
    sections: {
        title: string;
        body: string;
        items?: string[];
    }[];
    aiGenerated: boolean;
    provider?: string;
    offline?: boolean;
    exportStatus: 'placeholder' | 'ready';
    generatedAt: Timestamp;
    updatedAt?: Timestamp;
}

// Conversation (for AI mentor)
export interface Conversation {
    id?: string;
    title?: string;
    contextType: 'general' | 'morning' | 'task_review' | 'reflection';
    messages: {
        role: 'user' | 'assistant';
        content: string;
        timestamp: Timestamp;
    }[];
    isActive: boolean;
    createdAt: Timestamp;
    lastMessageAt: Timestamp;
}
