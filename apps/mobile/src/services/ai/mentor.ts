import { getErrorMessage } from '../../utils/errors';
import { callBackend } from './backendClient';

interface ChatResponse {
  response: string;
  conversationId: string;
  offline?: boolean;
}

interface GoalBreakdownResponse {
  milestones: string[];
}

interface ReflectionFeedbackResponse {
  feedback: string;
}

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
  contextType?: 'general' | 'morning' | 'task_review' | 'reflection'
): Promise<ChatResponse> => {
  try {
    const result = await callBackend<{ response: string; conversationId: string; offline?: boolean }>('/api/mentor', {
      message,
      conversationId,
      contextType,
    });

    if (result?.response) {
      return {
        response: result.response,
        conversationId: result.conversationId,
        offline: Boolean(result.offline),
      };
    }
  } catch (error) {
    console.warn('[AI] AltasAI backend mentor endpoint unavailable:', getErrorMessage(error));
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
  const result = await callBackend<GoalBreakdownResponse>('/api/goal-breakdown', {
    goalId,
    goalTitle,
    goalDescription,
  });

  return result.milestones;
};

export const generateReflectionFeedback = async (
  date: string
): Promise<string> => {
  const result = await callBackend<ReflectionFeedbackResponse>('/api/reflection-feedback', { date });

  return result.feedback;
};
