import type { SafeUserMemory } from '../../services/memory';
import type { BuiltFeatures, UserStateVector } from '../core/types';
import { analyzeReflectionText } from '../nlp/reflectionAnalyzer';

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const isOpenStatus = (status: unknown) => ['pending', 'in_progress', 'carried'].includes(String(status ?? 'pending'));

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return value.toDate();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const buildFeatures = (memory: SafeUserMemory, now = new Date()): BuiltFeatures => {
  const tasks = memory.tasks ?? [];
  const goals = memory.goals ?? [];
  const reflections = memory.reflections ?? [];
  const focusSessions = memory.focusSessions ?? [];
  const expenses = memory.expenses ?? [];
  const healthLogs = memory.healthLogs ?? [];
  const securityEvents = memory.securityEvents ?? [];

  const openTasks = tasks.filter((task) => isOpenStatus(task.status));
  const completedTasks = tasks.filter((task) => String(task.status) === 'completed');
  const carriedTasks = tasks.filter((task) => Boolean(task.isCarried) || Number(task.carryCount ?? 0) > 0);
  const criticalTasks = tasks.filter((task) => String(task.priority) === 'critical');
  const overdueTasks = openTasks.filter((task) => {
    const date = toDate(task.scheduledDate ?? task.deadline ?? task.dueDate);
    return date ? date.getTime() < now.getTime() : false;
  });

  const reflectionText = reflections.map((reflection) => JSON.stringify(reflection)).join(' ');
  const tsReflectionAnalysis = analyzeReflectionText(reflectionText);

  // Prefer the ML service analysis when available (richer signals)
  const mlAnalysis = memory.reflectionAnalysis;
  const reflectionAnalysis = mlAnalysis
    ? {
        moodScore: Math.round(((mlAnalysis.sentimentScore + 1) / 2) * 5),
        stressScore: mlAnalysis.stressScore,
        burnoutRiskSignal: mlAnalysis.burnoutRiskSignal,
        motivationScore: mlAnalysis.motivationScore,
      }
    : tsReflectionAnalysis;
  const totalFocusMinutes = focusSessions.reduce((sum, session) => sum + Number(session.durationMinutes ?? session.minutes ?? 0), 0);
  const successfulFocusSessions = focusSessions.filter((session) => String(session.status ?? 'completed') === 'completed').length;
  const averageGoalProgress = goals.length
    ? goals.reduce((sum, goal) => sum + Number(goal.progress ?? 0), 0) / goals.length
    : 0;

  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks ? completedTasks.length / totalTasks : 0;
  const overdueTaskRatio = openTasks.length ? overdueTasks.length / openTasks.length : 0;
  const focusConsistency = focusSessions.length ? successfulFocusSessions / focusSessions.length : 0;
  const expenseTotal = expenses.reduce((sum, expense) => sum + Number(expense.amount ?? 0), 0);
  const healthHabitScore = healthLogs.length
    ? healthLogs.reduce((sum, log) => sum + Number(log.routineScore ?? Number(log.energyLevel ?? 3) * 20), 0) / healthLogs.length
    : 55;
  const latestActivityDates = [...tasks, ...reflections, ...focusSessions]
    .map((item) => toDate(item.updatedAt ?? item.createdAt ?? item.date ?? item.scheduledDate))
    .filter((date): date is Date => Boolean(date));
  const latestActivity = latestActivityDates.sort((a, b) => b.getTime() - a.getTime())[0];
  const inactivityDays = latestActivity ? Math.floor((now.getTime() - latestActivity.getTime()) / 86_400_000) : 0;

  const workloadScore = clamp(openTasks.length * 9 + criticalTasks.length * 12 + overdueTasks.length * 10);
  const procrastinationScore = clamp(carriedTasks.length * 22 + overdueTaskRatio * 45 + (reflectionText.match(/delay|avoid|scroll|wasted/gi)?.length ?? 0) * 8);
  const burnoutSignalScore = mlAnalysis
    ? clamp(mlAnalysis.burnoutRiskSignal * 0.6 + reflectionAnalysis.stressScore * 0.25 + workloadScore * 0.15 + inactivityDays * 2)
    : clamp(reflectionAnalysis.stressScore * 0.7 + workloadScore * 0.35 + inactivityDays * 3);

  return {
    totalTasks,
    openTasks: openTasks.length,
    completedTasks: completedTasks.length,
    overdueTasks: overdueTasks.length,
    carriedTasks: carriedTasks.length,
    criticalTasks: criticalTasks.length,
    taskCompletionRate,
    overdueTaskRatio,
    focusSessions: focusSessions.length,
    focusMinutes: totalFocusMinutes,
    focusConsistency,
    goalCount: goals.length,
    averageGoalProgress,
    reflectionCount: reflections.length,
    reflectionMoodScore: reflectionAnalysis.moodScore * 20,
    reflectionStressScore: reflectionAnalysis.stressScore,
    workloadScore,
    consistencyScore: clamp(45 + taskCompletionRate * 35 + focusConsistency * 20 + reflections.length * 3 - carriedTasks.length * 8),
    executionScore: clamp(taskCompletionRate * 70 + completedTasks.length * 5 + focusConsistency * 20 - overdueTaskRatio * 35),
    procrastinationScore,
    burnoutSignalScore,
    financeRiskScore: clamp(expenseTotal > 0 ? Math.min(70, expenseTotal / 100) : 20),
    healthHabitScore: clamp(healthHabitScore),
    securityRiskScore: clamp(securityEvents.filter((event) => ['high', 'critical'].includes(String(event.severity ?? event.priority))).length * 30),
    inactivityDays,
  };
};

export const buildUserStateVector = (features: BuiltFeatures): UserStateVector => ({
  productivityScore: Math.round(clamp(features.executionScore)),
  focusScore: Math.round(clamp(35 + features.focusConsistency * 45 + Math.min(20, features.focusMinutes / 10))),
  consistencyScore: Math.round(clamp(features.consistencyScore)),
  stressSignal: Math.round(clamp(features.reflectionStressScore)),
  workloadScore: Math.round(clamp(features.workloadScore)),
  goalProgressScore: Math.round(clamp(features.averageGoalProgress || 40)),
  taskRiskScore: Math.round(clamp(features.overdueTaskRatio * 60 + features.carriedTasks * 12 + features.criticalTasks * 8)),
  reflectionMoodScore: Math.round(clamp(features.reflectionMoodScore || 55)),
  burnoutRiskScore: Math.round(clamp(features.burnoutSignalScore)),
  executionReadinessScore: Math.round(clamp(features.executionScore + features.healthHabitScore * 0.25 - features.burnoutSignalScore * 0.35)),
});
