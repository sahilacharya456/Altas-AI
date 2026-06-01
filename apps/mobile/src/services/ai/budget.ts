import { getErrorMessage } from '../../utils/errors';
import { callBackend } from './backendClient';

export interface BudgetInsight {
  type: 'warning' | 'critical' | 'success';
  message: string;
  action: string;
}

export const analyzeBudgetDiscipline = async (): Promise<BudgetInsight[]> => {
  try {
    const result = await callBackend<{ success: boolean; insights: BudgetInsight[] }>('/api/budget-discipline');
    return result.insights ?? [];
  } catch (error) {
    if (__DEV__) console.warn('[AI] Budget discipline unavailable:', getErrorMessage(error));
    return [{
      type: 'warning',
      message: 'AI budget analysis is unavailable. Review spending manually before adding discretionary expenses.',
      action: 'Check today expenses and pause non-essential purchases.',
    }];
  }
};
