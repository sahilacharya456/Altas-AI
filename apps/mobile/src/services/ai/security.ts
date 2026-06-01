import { getErrorMessage } from '../../utils/errors';
import type { InterventionSuggestion } from './interventions';
import { callBackend } from './backendClient';

const fallbackAdvice: InterventionSuggestion = {
  title: 'Use defensive verification',
  message: 'AI security advice is unavailable. Verify the source, avoid sharing credentials, and use official channels only.',
  priority: 'medium',
  action: 'Do not proceed until the source is verified.',
};

export const generateSecurityAdvice = async (input: string): Promise<InterventionSuggestion> => {
  try {
    const result = await callBackend<{ output: InterventionSuggestion }>('/api/security-advice', { input });
    return result.output;
  } catch (error) {
    if (__DEV__) console.warn('[AI] Security advice unavailable:', getErrorMessage(error));
    return fallbackAdvice;
  }
};
