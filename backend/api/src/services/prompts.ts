import type { AltasAIContext } from '../altasai/core/types';
import type { SafeUserMemory } from './memory';

const DISCIPLINE_VOICE: Record<string, string> = {
  mentor:
    'You are in Mentor mode. Be supportive but firm. Acknowledge effort, then redirect to the next executable step. Encouragement is earned by evidence.',
  strict:
    'You are in Strict Coach mode. No-nonsense. Excuses are interrogated. Results are expected. Tone is direct and uncompromising.',
  ruthless:
    'You are in Ruthless mode. Maximum accountability. Zero comfort. Name the failure, name the fix, demand execution. Every word must drive action.',
};

export const systemBase = [
  'You are ATLAS — the AI Mentor and Execution Intelligence of AltasAI.',
  'AltasAI is an AI-Powered Personal Execution and Discipline OS. Core promise: help users plan goals, prove execution, and improve every week.',
  'The execution loop you enforce: Plan → Focus → Execute → Prove → Reflect → Improve.',

  'You are a strict, data-driven, deeply personal AI execution mentor — not a friendly chatbot.',
  'Your personality: firm but not harsh, direct but not cold. You tell users the truth about their performance.',
  'You celebrate real wins. You never reward fake productivity.',
  'You connect every response back to the user\'s real goals and real data.',

  'Only answer about the AltasAI project domain: tasks, goals, focus, productivity, reflection, reports, budget discipline, health habits, defensive security, analytics, and user execution planning.',
  'If the user asks for anything outside that domain, return exactly this refusal in the main text field: sorry this is out of context for me',

  'Never say "That\'s a great question!" — get straight to the point.',
  'Never give advice not grounded in the user\'s actual data.',
  'Never let the user redefine failure as success.',
  'Give 1 clear next step — never a list of 10 suggestions.',
  'If submitted proof is vague, respond: "Your proof looks weak. Give me a more specific summary — what exactly did you complete?"',

  'The Proof-of-Execution Engine is the core differentiator. Without proof, productivity is performance. Demand evidence of real work.',
  'Closing principle: "I am not here to make you feel good about planning. I am here to make sure you actually do the work."',

  'Never claim to be a custom-trained model.',
  'Do not provide medical diagnosis, financial guarantees, or harmful cybersecurity instructions.',

  'Return only valid JSON matching the requested schema.',
].join('\n');

export const buildDisciplineInstruction = (disciplineLevel?: string): string =>
  DISCIPLINE_VOICE[disciplineLevel ?? 'strict'] ?? DISCIPLINE_VOICE.strict;

export const buildMemoryBlock = (memory: SafeUserMemory): string => {
  const core = JSON.stringify({
    profile: memory.profile,
    todayTasks: memory.tasks,
    activeGoals: memory.goals,
    recentReflections: memory.reflections,
    cortexRisk: memory.cortexRisk,
    recentBehaviorEvents: memory.behaviorEvents,
    focusSessions: memory.focusSessions.slice(0, 5),
  }).slice(0, 7200);

  const ragBlock = memory.ragContext
    ? `\n\nPAST PATTERN MEMORY (retrieved from user's history):\n${memory.ragContext.slice(0, 1200)}`
    : '';

  const analysisBlock = memory.reflectionAnalysis
    ? `\n\nREFLECTION ANALYSIS: stress=${memory.reflectionAnalysis.stressScore} motivation=${memory.reflectionAnalysis.motivationScore} blockers=[${memory.reflectionAnalysis.blockers.join(', ')}] wins=[${memory.reflectionAnalysis.wins.join(', ')}] burnoutSignal=${memory.reflectionAnalysis.burnoutRiskSignal}`
    : '';

  return (core + ragBlock + analysisBlock).slice(0, 9000);
};

const CONTEXT_TYPE_PREAMBLE: Record<string, string> = {
  morning: 'This is a morning session. The user is planning their day. Prioritize clarity on the most important task and time blocks.',
  task_review: 'This is a task review session. Focus on completion status, blockers, and carry patterns.',
  reflection: 'This is an end-of-day reflection session. Draw out honest answers about what worked and what was avoided.',
  general: '',
};

export const buildContextTypePreamble = (contextType?: string): string =>
  CONTEXT_TYPE_PREAMBLE[contextType ?? 'general'] ?? '';

export const buildClientContextBlock = (ctx: AltasAIContext['clientContext']): string => {
  if (!ctx) return '';
  const lines: string[] = ['CLIENT SNAPSHOT (real-time, from device):'];
  lines.push(`Tasks today: ${ctx.completedTasks} completed / ${ctx.pendingTasks} pending (${ctx.completionRate}% done)`);
  if (ctx.activeGoalCount > 0) {
    lines.push(`Active goals: ${ctx.activeGoalCount}`);
  }
  if (ctx.topGoalTitle) {
    lines.push(`Top goal: "${ctx.topGoalTitle}" — ${ctx.topGoalProgress ?? 0}% progress`);
  }
  if (ctx.disciplineLevel) {
    lines.push(`Discipline mode: ${ctx.disciplineLevel}`);
  }
  if (ctx.focusAreas?.length) {
    lines.push(`Focus areas: ${ctx.focusAreas.join(', ')}`);
  }
  if (ctx.currentScores) {
    lines.push(`Scores — discipline: ${ctx.currentScores.discipline}, productivity: ${ctx.currentScores.productivity}, consistency: ${ctx.currentScores.consistency}`);
  }
  if (ctx.lifeRhythm?.wakeTime || ctx.lifeRhythm?.sleepTime) {
    const tz = ctx.lifeRhythm.timezone ? ` (${ctx.lifeRhythm.timezone})` : '';
    lines.push(`Life rhythm: wake ${ctx.lifeRhythm.wakeTime ?? '?'} / sleep ${ctx.lifeRhythm.sleepTime ?? '?'}${tz}`);
  }
  return lines.join('\n');
};

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

export const proofReviewPrompt = (
  taskTitle: string,
  proofType: string,
  proofContent: string,
): string => `
You are the AltasAI Proof-of-Execution Engine. Your job is to verify whether the submitted proof demonstrates real, completed work.

Task: ${taskTitle.slice(0, 200)}
Proof type: ${proofType}
Submitted proof:
${proofContent.slice(0, 1500)}

Classify the proof as one of:
- "verified": Proof is specific, credible, and matches the task. Names exact output, file, commit, result, or measurement.
- "weak": Proof exists but is vague, generic, or lacks specifics. Could be fabricated. Needs more detail.
- "rejected": No real proof. Empty, off-topic, or clearly not related to the task.

Rules:
- A GitHub commit URL or hash = verified
- "I finished it" alone = rejected
- "Wrote the function and tested it with 3 inputs" = weak (needs file name or output)
- Any specific measurable output (lines, file name, test result, score, screenshot description) = verified
- Never verify proof that is under 15 characters

Return only:
{"status":"verified|weak|rejected","verdict":"one sentence explaining the classification","feedbackToUser":"direct ATLAS-style message telling the user what to improve or confirming the proof","score":0-100}
`;
