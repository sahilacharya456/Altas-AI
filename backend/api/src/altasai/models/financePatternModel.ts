import type { InternalAIResult } from '../core/types';

export const analyzeFinancePatterns = (expenses: Array<Record<string, unknown>>): InternalAIResult<'normal' | 'budget_risk' | 'unusual_spend'> => {
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const max = expenses.reduce((largest, expense) => Math.max(largest, Number(expense.amount ?? 0)), 0);
  const avg = expenses.length ? total / expenses.length : 0;
  const unusual = max > Math.max(1000, avg * 2.5);
  const score = Math.round(Math.min(100, unusual ? 70 : total / 100));
  return {
    label: unusual ? 'unusual_spend' : score >= 60 ? 'budget_risk' : 'normal',
    score,
    confidence: expenses.length ? 0.72 : 0.42,
    reasons: ['Finance model uses only user-entered expense data. No bank connection is inferred.'],
    evidence: [`expenseCount=${expenses.length}`, `total=${total}`, `max=${max}`],
    recommendation: score >= 60 ? 'Review discretionary spending before new purchases.' : 'Keep logging expenses for stronger pattern detection.',
    nextAction: score >= 60 ? 'Mark one category to pause today.' : 'Log the next expense honestly.',
  };
};
