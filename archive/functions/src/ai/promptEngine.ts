import type { AgentType } from './schemas';
import type { SafeMemoryContext } from './memory';
import { SAFETY_SYSTEM_RULES } from './safety';

export interface PromptBundle {
    systemInstruction: string;
    prompt: string;
}

const RESPONSE_SHAPES: Record<AgentType, string> = {
    command: '{"topPriority":"","executionRisk":0,"riskLevel":"low","reason":"","suggestedAction":"","avoidToday":[]}',
    mentor: '{"response":"","tone":"strict","nextActions":[]}',
    planner: '{"milestones":[]}',
    reflection: '{"feedback":"","pattern":"","tomorrowAction":""}',
    finance: '[{"title":"","message":"","priority":"medium","action":""}]',
    security: '{"title":"","message":"","priority":"medium","action":""}',
    report: '{"summary":"","wins":[],"risks":[],"nextWeekActions":[]}',
    intervention: '[{"title":"","message":"","priority":"medium","action":""}]',
};

const TASKS: Record<AgentType, string> = {
    command: 'Create today\'s command briefing from the provided context.',
    mentor: 'Respond as Atlas Mentor with direct guidance and concrete next actions.',
    planner: 'Break the goal into 3-7 executable milestones.',
    reflection: 'Review the reflection and return concise feedback.',
    finance: 'Generate budget discipline interventions without financial guarantees.',
    security: 'Give defensive security advice only. Do not provide offensive instructions.',
    report: 'Generate a weekly behavior report from deterministic Atlas context.',
    intervention: 'Generate intervention suggestions from risk and behavior context.',
};

export function buildPrompt(agent: AgentType, input: string, memory: SafeMemoryContext): PromptBundle {
    return {
        systemInstruction: `${SAFETY_SYSTEM_RULES}
Agent: ${agent}
Task: ${TASKS[agent]}
Return ONLY valid JSON matching this shape:
${RESPONSE_SHAPES[agent]}`,
        prompt: `SAFE USER CONTEXT:
${JSON.stringify(memory, null, 2)}

USER INPUT:
${input}`,
    };
}

export const buildDailyCommandPrompt = buildPrompt;
export const buildMentorPrompt = buildPrompt;
export const buildGoalBreakdownPrompt = buildPrompt;
export const buildReflectionPrompt = buildPrompt;
export const buildBudgetPrompt = buildPrompt;
export const buildSecurityPrompt = buildPrompt;
export const buildWeeklyReportPrompt = buildPrompt;
export const buildInterventionPrompt = buildPrompt;
