import { getErrorMessage } from '../../utils/errors';
import { callBackend } from './backendClient';

export interface InterventionSuggestion {
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  action: string;
}

const fallbackInterventions: InterventionSuggestion[] = [{
  title: 'Start one focus block',
  message: 'Reduce the plan to one executable task and start now.',
  priority: 'medium',
  action: 'Open Tasks and start Focus Mode.',
}];

export const generateInterventions = async (input?: string): Promise<InterventionSuggestion[]> => {
  try {
    const result = await callBackend<{ output: InterventionSuggestion[] }>('/api/interventions', { input });
    return result.output;
  } catch (error) {
    if (__DEV__) console.warn('[AI] Interventions unavailable:', getErrorMessage(error));
    return fallbackInterventions;
  }
};
