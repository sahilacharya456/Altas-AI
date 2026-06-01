import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';

import { ROUTES } from '../../../constants/routes';
import {
  calculateBudgetStatus,
  calculateNetBalance,
  checkCategoryLimits,
  getAllKhataEntries,
  getCurrentBudget,
  getOverdueEntries,
} from '../../../services/data';
import { useAuthStore } from '../../../stores/authStore';
import { ALTASAI_COLORS } from '../../../theme/colors';
import { safeImpactAsync, ImpactFeedbackStyle } from '../../../utils/haptics';
import type { KhataEntry, MonthlyBudget } from '../../../types/firestore';

export function useKhata() {
  const { user } = useAuthStore();
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [khataEntries, setKhataEntries] = useState<KhataEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.uid) {
      setBudget(null);
      setKhataEntries([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const [budgetData, entries] = await Promise.all([
        getCurrentBudget(user.uid),
        getAllKhataEntries(user.uid),
      ]);

      setBudget(budgetData);
      setKhataEntries(entries);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load Smart Khata data.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const budgetStatus = useMemo(
    () => (budget ? calculateBudgetStatus(budget) : null),
    [budget]
  );
  const khataBalance = useMemo(() => calculateNetBalance(khataEntries), [khataEntries]);
  const categoryViolations = useMemo(
    () => (budget ? checkCategoryLimits(budget) : []),
    [budget]
  );
  const overdueEntries = useMemo(() => getOverdueEntries(khataEntries), [khataEntries]);

  const paceColor = useMemo(() => {
    if (budgetStatus?.pace === 'over') return ALTASAI_COLORS.error.primary;
    if (budgetStatus?.pace === 'under') return ALTASAI_COLORS.success.primary;
    return ALTASAI_COLORS.warning.primary;
  }, [budgetStatus?.pace]);

  const percentSpent = Math.min(budgetStatus?.percentSpent ?? 0, 100);
  const financeDisciplineScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        (budgetStatus?.isOverBudget ? 32 : 0) -
        (budgetStatus?.pace === 'over' ? 18 : 0) -
        categoryViolations.length * 10 -
        overdueEntries.length * 8 -
        (khataBalance.youOwe > 0 ? 8 : 0)
    )
  );

  const financeInsight = useMemo(() => {
    if (!budgetStatus) {
      return 'AltasAI needs a monthly budget before finance signals become reliable.';
    }

    if (budgetStatus.isOverBudget) {
      return 'Overspending is now a Cortex risk signal. Freeze discretionary spend until the monthly budget is back under control.';
    }

    if (budgetStatus.pace === 'over') {
      return 'Spending pace is ahead of schedule. AltasAI will treat this as a discipline drift signal.';
    }

    if (overdueEntries.length > 0) {
      return `${overdueEntries.length} khata reminder${
        overdueEntries.length === 1 ? '' : 's'
      } need follow-up.`;
    }

    return 'Financial discipline is stable. Keep logging expenses before decisions become vague.';
  }, [budgetStatus, overdueEntries.length]);

  const handleAddExpense = useCallback(() => {
    safeImpactAsync(ImpactFeedbackStyle.Medium);
    router.push(ROUTES.MAIN.ADD_EXPENSE);
  }, []);

  const handleViewLedger = useCallback(() => {
    safeImpactAsync(ImpactFeedbackStyle.Light);
    router.push(ROUTES.MAIN.LEDGER);
  }, []);

  const handleViewHistory = useCallback(() => {
    safeImpactAsync(ImpactFeedbackStyle.Light);
    router.push(ROUTES.MAIN.EXPENSE_HISTORY);
  }, []);

  const handleViewInsights = useCallback(() => {
    safeImpactAsync(ImpactFeedbackStyle.Light);
    router.push(ROUTES.MAIN.BUDGET_INSIGHTS);
  }, []);

  return {
    budget,
    budgetStatus,
    khataBalance,
    categoryViolations,
    overdueEntries,
    isLoading,
    error,
    paceColor,
    percentSpent,
    financeDisciplineScore,
    financeInsight,
    retry: loadData,
    handleAddExpense,
    handleViewLedger,
    handleViewHistory,
    handleViewInsights,
  };
}
