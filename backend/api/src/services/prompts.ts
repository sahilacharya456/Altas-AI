import type { SafeUserMemory } from './memory';

export const systemBase = [
  'You are AltasAI, a personal discipline operating system assistant.',
  'Give direct, calm, execution-focused advice.',
  'Never claim to be a custom-trained model.',
  'Do not provide medical diagnosis, financial guarantees, or harmful cybersecurity instructions.',
  'Return only valid JSON matching the requested schema.',
].join('\n');

export const buildMemoryBlock = (memory: SafeUserMemory): string =>
  JSON.stringify({
    profile: memory.profile,
    todayTasks: memory.tasks,
    activeGoals: memory.goals,
    recentReflections: memory.reflections,
    cortexRisk: memory.cortexRisk,
    recentBehaviorEvents: memory.behaviorEvents,
  }).slice(0, 9000);

export const mentorPrompt = (message: string, memory: SafeUserMemory): string => `
Context:
${buildMemoryBlock(memory)}

User message:
${message}

Return:
{"response":"short mentor response","tone":"strict","nextActions":["action 1","action 2"]}
`;

export const dailyBriefingPrompt = (input: string | undefined, memory: SafeUserMemory): string => `
Context:
${buildMemoryBlock(memory)}

Additional input:
${input ?? 'none'}

Return:
{"topPriority":"","executionRisk":0,"riskLevel":"low|medium|high|critical","reason":"","suggestedAction":"","avoidToday":[""]}
`;

export const weeklyReportPrompt = (input: string | undefined, memory: SafeUserMemory): string => `
Context:
${buildMemoryBlock(memory)}

Additional input:
${input ?? 'none'}

Return:
{"summary":"","wins":[""],"risks":[""],"nextWeekActions":[""]}
`;

export const goalBreakdownPrompt = (title: string, description?: string): string => `
Goal title: ${title}
Goal description: ${description ?? 'none'}

Break this goal into 4-6 concrete milestones.
Return:
{"milestones":[""]}
`;

export const reflectionFeedbackPrompt = (reflection: Record<string, unknown>): string => `
Reflection:
${JSON.stringify(reflection).slice(0, 5000)}

Return:
{"feedback":"direct private reflection feedback","pattern":"one pattern","tomorrowAction":"one concrete action"}
`;

export const budgetPrompt = (memory: SafeUserMemory): string => `
Context:
${buildMemoryBlock(memory)}

Return budget discipline insights only. No financial guarantees.
Return:
{"insights":[{"type":"warning|critical|success","message":"","action":""}]}
`;

export const interventionPrompt = (input: string | undefined, memory: SafeUserMemory): string => `
Context:
${buildMemoryBlock(memory)}
Input: ${input ?? 'none'}

Return:
{"interventions":[{"title":"","message":"","priority":"low|medium|high|critical","action":""}]}
`;

export const securityPrompt = (input: string): string => `
User security question:
${input}

Give defensive, safe cybersecurity guidance only.
Return:
{"title":"","message":"","priority":"low|medium|high|critical","action":""}
`;
