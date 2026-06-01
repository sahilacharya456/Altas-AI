import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';

import { DISCIPLINE_LEVELS } from '../../../constants/discipline';
import { ROUTES } from '../../../constants/routes';
import {
  createTaskFromIntervention,
  ignoreIntervention,
  listActiveInterventions,
} from '../../../services/data';
import { useAnalyticsStore } from '../../../stores/analyticsStore';
import { useAuthStore } from '../../../stores/authStore';
import { useGoalsStore } from '../../../stores/goalsStore';
import { useTasksStore } from '../../../stores/tasksStore';
import type { Intervention } from '../../../types/firestore';
import { safeImpactAsync, ImpactFeedbackStyle } from '../../../utils/haptics';
import { priorityRank, quickModules } from '../constants';
import type { HomeRoutePath } from '../types';
import { getRiskLevel, getTaskDate } from '../utils';

export function useHomeDashboard() {
  const { user, profile } = useAuthStore();
  const {
    tasks,
    carriedTasks,
    summary,
    isLoading: tasksLoading,
    error: tasksError,
    initialize: initializeTasks,
  } = useTasksStore();
  const { goals, initialize: initializeGoals } = useGoalsStore();
  const {
    dashboard,
    error: analyticsError,
    loadDashboard,
    initialize: initializeAnalytics,
  } = useAnalyticsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [interventions, setInterventions] = useState<Intervention[]>([]);

  const disciplineConfig = profile?.disciplineLevel
    ? DISCIPLINE_LEVELS[profile.disciplineLevel]
    : DISCIPLINE_LEVELS.strict;

  const loadInterventions = useCallback(async () => {
    if (!user?.uid) {
      setInterventions([]);
      return;
    }

    try {
      setInterventions(await listActiveInterventions(user.uid, 2));
    } catch {
      setInterventions([]);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    initializeAnalytics(user.uid);
    void loadDashboard();
    void loadInterventions();
  }, [user?.uid, initializeAnalytics, loadDashboard, loadInterventions]);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribeTasks = initializeTasks(user.uid);
    const unsubscribeGoals = initializeGoals(user.uid);

    return () => {
      unsubscribeTasks();
      unsubscribeGoals();
    };
  }, [user?.uid, initializeTasks, initializeGoals]);

  const pendingTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status === 'pending' || task.status === 'in_progress' || task.status === 'carried'
      ),
    [tasks]
  );

  const topActions = useMemo(() => {
    return [...pendingTasks]
      .sort((a, b) => {
        const priorityDelta = priorityRank[b.priority] - priorityRank[a.priority];
        if (priorityDelta !== 0) return priorityDelta;

        const carryDelta = (b.carryCount ?? 0) - (a.carryCount ?? 0);
        if (carryDelta !== 0) return carryDelta;

        return getTaskDate(a.scheduledDate).getTime() - getTaskDate(b.scheduledDate).getTime();
      })
      .slice(0, 3);
  }, [pendingTasks]);

  const commandState = useMemo(() => {
    const completionRate = summary.total > 0 ? summary.completed / summary.total : 0;
    const remainingTasks = Math.max(summary.total - summary.completed, 0);
    const carriedCount = Math.max(summary.carried, carriedTasks.length);
    const criticalPending = pendingTasks.filter((task) => task.priority === 'critical').length;
    const highPending = pendingTasks.filter((task) => task.priority === 'high').length;
    const goalPressure = goals.filter(
      (goal) => goal.priority === 'high' || goal.priority === 'critical'
    ).length;

    const riskScore = Math.max(
      0,
      Math.min(
        100,
        remainingTasks * 10 +
          carriedCount * 16 +
          criticalPending * 18 +
          highPending * 10 +
          goalPressure * 4 -
          Math.round(completionRate * 20)
      )
    );

    const topPriority = topActions[0]?.title ?? 'Create one clear execution task';
    const riskReason =
      carriedCount > 0
        ? `${carriedCount} carried task${carriedCount === 1 ? '' : 's'} are creating execution debt.`
        : remainingTasks >= 6
          ? `${remainingTasks} tasks are still open, so attention is fragmented.`
          : criticalPending > 0
            ? 'A critical task is still unresolved.'
            : summary.total === 0
              ? 'No execution plan exists for today yet.'
              : 'Your current task load is manageable if you protect one focus block.';

    const suggestedAction = topActions[0]
      ? `Start with "${topActions[0].title}" before opening secondary modules.`
      : 'Add one high-impact task, then start a focused execution block.';

    const warning =
      carriedCount > 0
        ? 'Carried work is the highest risk today. Clear or rescope it before adding new tasks.'
        : remainingTasks >= 6
          ? 'Your plan is too wide. Pick three actions and defer the rest.'
          : summary.total === 0
            ? 'AltasAI has no task signal for today. Build a plan before the day becomes reactive.'
            : dashboard?.week.trend === 'down'
              ? 'Your weekly execution trend is slipping. Keep the next block small and measurable.'
              : 'No severe risk detected. Stay with the plan and avoid context switching.';

    const cortexInsight =
      dashboard?.week.trend === 'up'
        ? 'Your execution trend is improving. Protect the same routine that created the lift.'
        : dashboard?.week.trend === 'down'
          ? 'Your execution trend is down. Reduce task load and finish one visible action early.'
          : 'Your best execution window appears to be morning. Start the hardest task before reactive work.';

    return {
      completionRate,
      remainingTasks,
      carriedCount,
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      topPriority,
      riskReason,
      suggestedAction,
      warning,
      cortexInsight,
    };
  }, [summary, carriedTasks.length, pendingTasks, goals, topActions, dashboard?.week.trend]);

  const handleNavigation = useCallback((path: HomeRoutePath) => {
    safeImpactAsync(ImpactFeedbackStyle.Light);
    router.push(path as never);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboard();
      await loadInterventions();
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboard, loadInterventions]);

  const acceptInterventionCard = useCallback(
    async (intervention: Intervention) => {
      if (!user?.uid) return;
      await createTaskFromIntervention(intervention, user.uid);
      await loadInterventions();
    },
    [loadInterventions, user?.uid]
  );

  const ignoreInterventionCard = useCallback(
    async (intervention: Intervention) => {
      if (!user?.uid || !intervention.id) return;
      await ignoreIntervention(intervention.id);
      await loadInterventions();
    },
    [loadInterventions, user?.uid]
  );

  return {
    profile,
    disciplineConfig,
    topActions,
    summary,
    tasksLoading,
    refreshing,
    interventions,
    commandState,
    quickModules,
    disciplineScore: dashboard?.scores.discipline ?? profile?.currentScores.discipline ?? 50,
    streakDays: dashboard?.streakDays ?? 0,
    firstName: profile?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Commander',
    hasError: tasksError || analyticsError,
    loadDashboard,
    onRefresh,
    handleNavigation,
    acceptInterventionCard,
    ignoreInterventionCard,
    routes: ROUTES.MAIN,
  };
}
