export type AgentType =
    | 'command'
    | 'mentor'
    | 'planner'
    | 'reflection'
    | 'finance'
    | 'security'
    | 'report'
    | 'intervention';

export interface DailyBriefing {
    topPriority: string;
    executionRisk: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    suggestedAction: string;
    avoidToday: string[];
}

export interface MentorResponse {
    response: string;
    tone: 'mentor' | 'strict' | 'ruthless';
    nextActions: string[];
}

export interface GoalBreakdown {
    milestones: string[];
}

export interface ReflectionFeedback {
    feedback: string;
    pattern: string;
    tomorrowAction: string;
}

export interface InterventionSuggestion {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    action: string;
}

export interface WeeklyReport {
    summary: string;
    wins: string[];
    risks: string[];
    nextWeekActions: string[];
}

export interface AgentOutputMap {
    command: DailyBriefing;
    mentor: MentorResponse;
    planner: GoalBreakdown;
    reflection: ReflectionFeedback;
    finance: InterventionSuggestion[];
    security: InterventionSuggestion;
    report: WeeklyReport;
    intervention: InterventionSuggestion[];
}

export type AgentOutput<T extends AgentType> = AgentOutputMap[T];

export const fallbackDailyBriefing = (): DailyBriefing => ({
    topPriority: 'Choose one task and execute it first.',
    executionRisk: 35,
    riskLevel: 'medium',
    reason: 'AI provider is unavailable, so Atlas is using deterministic fallback guidance.',
    suggestedAction: 'Start a 10 minute focus block on the highest-priority task.',
    avoidToday: ['Adding new tasks before completing one existing task'],
});

export const fallbackMentorResponse = (): MentorResponse => ({
    response: 'Atlas AI is in offline fallback mode. Pick one task, run a short focus block, and report the blocker.',
    tone: 'strict',
    nextActions: ['Pick one task', 'Work for 10 minutes', 'Log what blocked you'],
});

export const fallbackGoalBreakdown = (): GoalBreakdown => ({
    milestones: ['Define the outcome', 'Complete the first execution step', 'Review progress and adjust'],
});

export const fallbackReflectionFeedback = (): ReflectionFeedback => ({
    feedback: 'Reflection saved. Tomorrow, reduce the plan to one priority and protect the first focus block.',
    pattern: 'Fallback feedback because AI provider is unavailable.',
    tomorrowAction: 'Define one priority before starting the day.',
});

export const fallbackWeeklyReport = (): WeeklyReport => ({
    summary: 'Weekly report is using offline fallback because the AI provider is unavailable.',
    wins: ['Execution data was captured'],
    risks: ['Not enough AI-generated analysis available'],
    nextWeekActions: ['Keep tasks small', 'Complete daily reflections', 'Protect focus sessions'],
});

export const fallbackInterventions = (): InterventionSuggestion[] => ([{
    title: 'Start one focus block',
    message: 'Reduce the plan to one executable task and start now.',
    priority: 'medium',
    action: 'Open Tasks and start Focus Mode.',
}]);

export function validateAgentOutput<T extends AgentType>(agent: T, value: unknown): AgentOutput<T> {
    if (!value || typeof value !== 'object') return fallbackForAgent(agent);
    const data = value as Record<string, unknown>;

    switch (agent) {
        case 'command':
            if (typeof data.topPriority === 'string' && typeof data.suggestedAction === 'string') return value as AgentOutput<T>;
            break;
        case 'mentor':
            if (typeof data.response === 'string') return value as AgentOutput<T>;
            break;
        case 'planner':
            if (Array.isArray(data.milestones)) return value as AgentOutput<T>;
            break;
        case 'reflection':
            if (typeof data.feedback === 'string') return value as AgentOutput<T>;
            break;
        case 'report':
            if (typeof data.summary === 'string') return value as AgentOutput<T>;
            break;
        case 'finance':
        case 'intervention':
            if (Array.isArray(value)) return value as AgentOutput<T>;
            break;
        case 'security':
            if (typeof data.title === 'string' && typeof data.message === 'string') return value as AgentOutput<T>;
            break;
    }

    return fallbackForAgent(agent);
}

export function fallbackForAgent<T extends AgentType>(agent: T): AgentOutput<T> {
    const fallbacks: AgentOutputMap = {
        command: fallbackDailyBriefing(),
        mentor: fallbackMentorResponse(),
        planner: fallbackGoalBreakdown(),
        reflection: fallbackReflectionFeedback(),
        finance: fallbackInterventions(),
        security: fallbackInterventions()[0],
        report: fallbackWeeklyReport(),
        intervention: fallbackInterventions(),
    };
    return fallbacks[agent] as AgentOutput<T>;
}
