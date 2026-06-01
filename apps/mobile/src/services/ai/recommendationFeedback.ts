import { getErrorMessage } from '../../utils/errors';
import { callBackend } from './backendClient';

export type RecommendationFeedbackAction =
  | 'shown'
  | 'accepted'
  | 'dismissed'
  | 'completed'
  | 'not_helpful'
  | 'helpful';

export interface RecommendationFeedbackPayload {
  recommendationId: string;
  source?: 'mentor' | 'cortex' | 'intervention' | 'report' | 'daily_plan';
  action: RecommendationFeedbackAction;
  recommendationType?: string;
  variant?: 'A' | 'B';
  outcome?: 'unknown' | 'success' | 'failed' | 'skipped';
  rating?: number;
  context?: Record<string, unknown>;
}

export interface RecommendationFeedbackResult {
  ok: boolean;
  recommendationId: string;
  variant: 'A' | 'B';
  reward: number;
  stored: boolean;
}

export const submitRecommendationFeedback = async (
  payload: RecommendationFeedbackPayload
): Promise<RecommendationFeedbackResult | null> => {
  try {
    return await callBackend<RecommendationFeedbackResult>('/api/recommendations/feedback', { ...payload });
  } catch (error) {
    if (__DEV__) console.warn('[AI] Recommendation feedback unavailable:', getErrorMessage(error));
    return null;
  }
};
