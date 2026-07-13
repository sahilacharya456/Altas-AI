import { db, FieldValue, Timestamp } from '../lib/firebaseAdmin';
import { runMentorOrchestration } from '../altasai';
import type { AltasAIContext, MentorResponsePlan } from '../altasai/core/types';
import type { SafeUserMemory } from './memory';
import { isProjectScopedInput, OUT_OF_CONTEXT_RESPONSE } from './projectScope';

type AgentActionType =
  | 'create_task'
  | 'create_behavior_event'
  | 'recommend_next_action';

type AgentActionStatus = 'planned' | 'executed' | 'blocked';

export interface MentorAgentAction {
  id: string;
  type: AgentActionType;
  status: AgentActionStatus;
  title: string;
  reason: string;
  risk: 'low' | 'medium' | 'high';
  payload: Record<string, unknown>;
  result?: Record<string, unknown>;
}

export interface MentorAgentResult {
  response: string;
  provider: 'internal' | 'gemini';
  offline: boolean;
  plan: MentorResponsePlan;
  nextActions: string[];
  actions: MentorAgentAction[];
  security: {
    scoped: boolean;
    mode: 'advise' | 'auto';
    allowedActions: AgentActionType[];
    blockedReason?: string;
  };
}

const MAX_AUTO_ACTIONS = 3;

const explicitAutomationPattern =
  /\b(add|create|schedule|plan|make|set up|prepare|generate|break down)\b/i;

const planRequestPattern =
  /\b(plan my|plan next|next\s+\d+\s+(hour|hours|minute|minutes)|what should i do next|next action)\b/i;

const taskTitlePattern =
  /\b(?:add|create|schedule|make)\s+(?:a\s+)?(?:task|todo|mission)?\s*(?:to|for)?\s*(.+)$/i;

const categoryFromText = (text: string): 'career' | 'health' | 'fitness' | 'study' | 'personal' | 'routine' => {
  const lower = text.toLowerCase();
  if (/\b(study|exam|class|course|learn|assignment)\b/.test(lower)) return 'study';
  if (/\b(workout|gym|run|exercise|fitness)\b/.test(lower)) return 'fitness';
  if (/\b(sleep|water|health|meditation|recovery)\b/.test(lower)) return 'health';
  if (/\b(work|career|job|client|report|project|launch)\b/.test(lower)) return 'career';
  if (/\b(routine|daily|habit)\b/.test(lower)) return 'routine';
  return 'personal';
};

const priorityFromText = (text: string): 'low' | 'medium' | 'high' | 'critical' => {
  const lower = text.toLowerCase();
  if (/\b(critical|urgent|emergency|must)\b/.test(lower)) return 'critical';
  if (/\b(high|important|priority)\b/.test(lower)) return 'high';
  if (/\b(low|later|optional)\b/.test(lower)) return 'low';
  return 'medium';
};

const minutesFromText = (text: string, fallback = 30): number => {
  const match = text.match(/\b(\d{1,3})\s*(minute|minutes|min|mins|hour|hours|hr|hrs)\b/i);
  if (!match) return fallback;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const minutes = unit.startsWith('h') ? amount * 60 : amount;
  return Math.min(Math.max(minutes, 5), 240);
};

const taskTitleFromMessage = (message: string): string | null => {
  const match = message.match(taskTitlePattern);
  if (!match?.[1]) return null;
  return match[1].replace(/\s+(today|tomorrow|for today)$/i, '').trim().slice(0, 140) || null;
};

const topMemoryTaskTitle = (memory: SafeUserMemory): string | null => {
  const task = memory.tasks.find((item) => {
    const status = String(item.status ?? '');
    return status === 'pending' || status === 'in_progress' || status === 'carried';
  });
  return typeof task?.title === 'string' && task.title.trim() ? task.title.trim() : null;
};

const todayAtNextHour = (): Date => {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return date;
};

const buildActions = (
  userId: string,
  message: string,
  memory: SafeUserMemory,
  plan: MentorResponsePlan
): MentorAgentAction[] => {
  const actions: MentorAgentAction[] = [];
  const shouldAutomate = explicitAutomationPattern.test(message) || planRequestPattern.test(message);
  if (!shouldAutomate) {
    return plan.recommendations.slice(0, 3).map((recommendation, index) => ({
      id: `recommend_${index + 1}`,
      type: 'recommend_next_action',
      status: 'planned',
      title: recommendation.title,
      reason: recommendation.reason,
      risk: 'low',
      payload: { action: recommendation.action, priority: recommendation.priority },
    }));
  }

  const directTitle = taskTitleFromMessage(message);
  if (directTitle) {
    actions.push({
      id: 'create_task_1',
      type: 'create_task',
      status: 'planned',
      title: directTitle,
      reason: 'User explicitly asked the mentor agent to create a task.',
      risk: 'low',
      payload: {
        userId,
        title: directTitle,
        description: `Created by AltasAI Mentor Agent from: ${message.slice(0, 240)}`,
        category: categoryFromText(message),
        priority: priorityFromText(message),
        status: 'pending',
        scheduledDate: todayAtNextHour(),
        estimatedMinutes: minutesFromText(message),
        tags: ['mentor-agent'],
        source: 'AI',
        context: message.slice(0, 500),
      },
    });
  } else if (planRequestPattern.test(message)) {
    const title = topMemoryTaskTitle(memory) ?? plan.recommendations[0]?.action ?? 'Execute the highest-impact task';
    actions.push({
      id: 'create_task_1',
      type: 'create_task',
      status: 'planned',
      title: `Focus block: ${title}`.slice(0, 140),
      reason: 'User asked the mentor agent to plan the next execution block.',
      risk: 'low',
      payload: {
        userId,
        title: `Focus block: ${title}`.slice(0, 140),
        description: 'One protected block created by AltasAI Mentor Agent.',
        category: categoryFromText(title),
        priority: 'high',
        status: 'pending',
        scheduledDate: todayAtNextHour(),
        estimatedMinutes: minutesFromText(message, 45),
        tags: ['mentor-agent', 'focus'],
        source: 'AI',
        context: message.slice(0, 500),
      },
    });
  }

  actions.push({
    id: 'behavior_event_1',
    type: 'create_behavior_event',
    status: 'planned',
    title: 'Mentor agent automation requested',
    reason: 'Record the automation signal for Cortex analysis.',
    risk: 'low',
    payload: {
      userId,
      source: 'mentor',
      eventType: 'mentor_agent_automation',
      severity: 'low',
      title: 'Mentor agent automation requested',
      message: message.slice(0, 500),
      metadata: { plannedActionCount: actions.length },
      occurredAt: new Date(),
      signalStrength: 55,
    },
  });

  return actions.slice(0, MAX_AUTO_ACTIONS);
};

const executeAction = async (userId: string, action: MentorAgentAction): Promise<MentorAgentAction> => {
  if (action.risk !== 'low') {
    return { ...action, status: 'blocked', result: { reason: 'Only low-risk mentor agent actions can execute automatically.' } };
  }

  if (action.type === 'create_task') {
    const payload = action.payload;
    const doc = await db.collection(`users/${userId}/tasks`).add({
      ...payload,
      userId,
      scheduledDate: Timestamp.fromDate(payload.scheduledDate as Date),
      isCarried: false,
      carryCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ...action, status: 'executed', result: { taskId: doc.id } };
  }

  if (action.type === 'create_behavior_event') {
    const payload = action.payload;
    const doc = await db.collection(`users/${userId}/behaviorEvents`).add({
      ...payload,
      userId,
      occurredAt: payload.occurredAt instanceof Date ? Timestamp.fromDate(payload.occurredAt) : FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    });
    return { ...action, status: 'executed', result: { eventId: doc.id } };
  }

  return action;
};

export const runSecureMentorAgent = async (
  context: AltasAIContext,
  options: { enhanceWithGemini?: boolean; automationMode?: 'advise' | 'auto' } = {}
): Promise<MentorAgentResult> => {
  const message = context.message ?? '';
  if (!isProjectScopedInput(message)) {
    return {
      response: OUT_OF_CONTEXT_RESPONSE,
      provider: 'internal',
      offline: true,
      plan: {
        intent: { label: 'unknown', confidence: 1, reasons: [OUT_OF_CONTEXT_RESPONSE] },
        entities: [],
        patterns: [],
        recommendations: [],
        userState: OUT_OF_CONTEXT_RESPONSE,
        adviceType: 'support',
        safetyConstraints: ['Only answer within the AltasAI project domain.'],
        responseStructure: ['refusal'],
        fallbackResponse: OUT_OF_CONTEXT_RESPONSE,
      },
      nextActions: [],
      actions: [],
      security: {
        scoped: false,
        mode: options.automationMode ?? 'auto',
        allowedActions: ['create_task', 'create_behavior_event', 'recommend_next_action'],
        blockedReason: OUT_OF_CONTEXT_RESPONSE,
      },
    };
  }

  const mentor = await runMentorOrchestration(context, { enhanceWithGemini: options.enhanceWithGemini, useML: true });
  const plannedActions = buildActions(context.userId, message, context.memory, mentor.plan);
  const mode = options.automationMode ?? 'auto';
  const actions = mode === 'auto'
    ? await Promise.all(plannedActions.map((action) => executeAction(context.userId, action).catch((error) => ({
      ...action,
      status: 'blocked' as const,
      result: { reason: error instanceof Error ? error.message : String(error) },
    }))))
    : plannedActions;

  const executedTasks = actions.filter((action) => action.type === 'create_task' && action.status === 'executed').length;
  const response = executedTasks > 0
    ? `${mentor.response}\n\nAgent action: created ${executedTasks} task${executedTasks === 1 ? '' : 's'} for you.`
    : mentor.response;

  return {
    response,
    provider: mentor.provider,
    offline: mentor.offline,
    plan: mentor.plan,
    nextActions: mentor.nextActions,
    actions,
    security: {
      scoped: true,
      mode,
      allowedActions: ['create_task', 'create_behavior_event', 'recommend_next_action'],
    },
  };
};
