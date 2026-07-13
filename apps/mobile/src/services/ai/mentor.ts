import { getErrorMessage } from '../../utils/errors';
import { BackendApiError, callBackend } from './backendClient';

import type { MentorAction } from '../../features/mentor/types';

interface ClientContext {
  pendingTasks: number;
  completedTasks: number;
  completionRate: number;
  activeGoalCount: number;
  topGoalTitle?: string;
  topGoalProgress?: number;
  disciplineLevel?: 'mentor' | 'strict' | 'ruthless';
  focusAreas?: string[];
  currentScores?: { discipline: number; productivity: number; consistency: number };
  lifeRhythm?: { wakeTime?: string; sleepTime?: string; timezone?: string };
}

interface ChatResponse {
  response: string;
  conversationId: string;
  offline?: boolean;
  actions?: MentorAction[];
  nextActions?: string[];
  clientContext?: ClientContext;
}

interface GoalBreakdownResponse {
  milestones: string[];
}

interface ReflectionFeedbackResponse {
  feedback: string;
}

const REFLECTION_FALLBACK =
  'Reflection saved. AltasAI feedback is offline right now; choose one concrete action for tomorrow and keep the loop moving.';

const OFFLINE_RESPONSE = [
  'AltasAI Mentor is temporarily offline.',
  '',
  'Keep execution simple:',
  '1. Pick one task.',
  '2. Work for 10 minutes.',
  '3. Write down the blocker.',
  '',
  'Your next action matters more than another plan.',
].join('\n');

/**
 * Chat with the AI mentor through the Spark-compatible AltasAI backend API.
 *
 * Paid AI provider keys must stay server-side in the backend environment.
 * The mobile app must never call Gemini/OpenAI-compatible APIs directly and
 * must not use the archived legacy Express API as a production AI path.
 */
export const chatWithMentor = async (
  message: string,
  conversationId?: string,
  contextType?: 'general' | 'morning' | 'task_review' | 'reflection',
  clientContext?: ChatResponse['clientContext']
): Promise<ChatResponse> => {
  try {
    const result = await callBackend<ChatResponse>('/api/mentor', {
      message,
      conversationId,
      contextType,
      clientContext,
    });

    if (result?.response) {
      return {
        response: result.response,
        conversationId: result.conversationId,
        offline: Boolean(result.offline),
        actions: result.actions,
        nextActions: result.nextActions,
        clientContext,
      };
    }
  } catch (error) {
    if (error instanceof BackendApiError && error.status && error.status < 500 && error.status !== 408) {
      throw error;
    }
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[AI] AltasAI backend mentor endpoint unavailable:', getErrorMessage(error));
    }
  }

  return {
    response: OFFLINE_RESPONSE,
    conversationId: conversationId || 'offline-standby-session',
    offline: true,
  };
};

export const generateGoalBreakdown = async (
  goalId: string,
  goalTitle: string,
  goalDescription?: string
): Promise<string[]> => {
  const fallback = buildLocalGoalBreakdown(goalTitle, goalDescription);

  try {
    const result = await callBackend<GoalBreakdownResponse>('/api/goal-breakdown', {
      goalId,
      goalTitle,
      goalDescription,
    });

    return result.milestones?.length ? result.milestones : fallback;
  } catch (error) {
    if (__DEV__) console.warn('[AI] Goal breakdown backend unavailable:', getErrorMessage(error));
    return fallback;
  }
};

const buildLocalGoalBreakdown = (goalTitle: string, goalDescription?: string): string[] => {
  const goal = goalTitle.trim() || 'this goal';
  const context = goalDescription?.trim();

  return [
    `Define the exact outcome for "${goal}"`,
    context ? `Extract the first concrete requirement from: ${context.slice(0, 90)}` : `List the first three actions needed for "${goal}"`,
    'Schedule one focused 45-minute work block',
    'Complete the smallest visible milestone',
    'Review progress and choose the next action',
  ];
};

export const generateReflectionFeedback = async (
  date: string
): Promise<string> => {
  try {
    const result = await callBackend<ReflectionFeedbackResponse>('/api/reflection-feedback', { date });
    return result.feedback || REFLECTION_FALLBACK;
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[AI] Reflection feedback backend unavailable:', getErrorMessage(error));
    }
    return REFLECTION_FALLBACK;
  }
};

export const recordMentorReward = async (
  action: string,
  reward: number
): Promise<void> => {
  try {
    await callBackend('/api/reward', { action, reward });
  } catch {
    // Fire-and-forget: reward recording never blocks the UI.
  }
};
