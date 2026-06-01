import patternsDataset from '../datasets/productivity-patterns.json';
import type { AltasAIContext, ProductivityPattern } from '../core/types';
import { analyzeReflectionText } from '../nlp/reflectionAnalyzer';

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return value.toDate();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const analyzeProductivityPatterns = ({ memory, message = '', now = new Date() }: AltasAIContext): ProductivityPattern[] => {
  const results: ProductivityPattern[] = [];
  const openTasks = memory.tasks.filter((task) => ['pending', 'in_progress', 'carried'].includes(String(task.status ?? 'pending')));
  const carriedTasks = memory.tasks.filter((task) => Boolean(task.isCarried) || Number(task.carryCount ?? 0) > 0);
  const criticalTasks = memory.tasks.filter((task) => String(task.priority) === 'critical');
  const completedTasks = memory.tasks.filter((task) => String(task.status) === 'completed');
  const activeGoals = memory.goals.filter((goal) => String(goal.status ?? 'active') === 'active');
  const recentReflectionText = memory.reflections.map((item) => JSON.stringify(item)).join(' ');
  const combinedText = `${message} ${recentReflectionText}`.toLowerCase();

  if (openTasks.length >= 7 || /too many tasks|overwhelmed|confused/.test(combinedText)) {
    results.push({
      label: 'overloaded_task_list',
      confidence: Math.min(0.95, 0.55 + openTasks.length * 0.05),
      reason: `${openTasks.length} open tasks or overload language detected.`,
      signals: ['tasks.open_count', 'reflection.overload_language'],
    });
  }

  if (carriedTasks.length > 0 || /wasted|avoided|delayed|scrolling|excuse/.test(combinedText)) {
    results.push({
      label: 'procrastination',
      confidence: Math.min(0.92, 0.52 + carriedTasks.length * 0.12),
      reason: `${carriedTasks.length} carried tasks or avoidance language detected.`,
      signals: ['tasks.carry_debt', 'reflection.avoidance_language'],
    });
  }

  const overdue = memory.tasks.filter((task) => {
    const date = toDate(task.scheduledDate);
    return date && date < now && !['completed', 'cancelled'].includes(String(task.status));
  });
  if (overdue.length > 0) {
    results.push({
      label: 'missed_deadlines',
      confidence: Math.min(0.9, 0.5 + overdue.length * 0.1),
      reason: `${overdue.length} tasks appear overdue.`,
      signals: ['tasks.overdue'],
    });
  }

  if (/late night|2am|3am|midnight/.test(combinedText)) {
    results.push({
      label: 'late_night_activity',
      confidence: 0.68,
      reason: 'Late-night activity language appeared in recent context.',
      signals: ['reflection.late_night_language'],
    });
  }

  const reflectionAnalysis = analyzeReflectionText(combinedText);
  if (reflectionAnalysis.stressScore >= 45 || /burnout|exhausted|low energy|drained/.test(combinedText)) {
    results.push({
      label: 'burnout_risk',
      confidence: Math.min(0.9, 0.5 + reflectionAnalysis.stressScore / 140),
      reason: 'Stress, exhaustion, or low-energy signals are present.',
      signals: ['reflection.stress', 'health.energy'],
    });
  }

  if (activeGoals.some((goal) => Number(goal.progress ?? 0) <= 10) && activeGoals.length >= 2) {
    results.push({
      label: 'goal_stagnation',
      confidence: 0.62,
      reason: 'Active goals exist with little recorded progress.',
      signals: ['goals.low_progress'],
    });
  }

  if (completedTasks.length >= 3 && carriedTasks.length === 0) {
    results.push({
      label: 'high_productivity_streak',
      confidence: 0.7,
      reason: 'Multiple completed tasks and no carry debt in current context.',
      signals: ['tasks.completed_count'],
    });
  }

  for (const pattern of patternsDataset) {
    if (pattern.keywords.some((keyword) => combinedText.includes(keyword)) && !results.some((result) => result.label === pattern.label)) {
      results.push({
        label: pattern.label as ProductivityPattern['label'],
        confidence: 0.58,
        reason: `Matched local pattern keywords for ${pattern.label}.`,
        signals: ['nlp.pattern_keywords'],
      });
    }
  }

  if (results.length === 0) {
    results.push({
      label: criticalTasks.length > 0 ? 'weak_planning' : 'stable_execution',
      confidence: criticalTasks.length > 0 ? 0.55 : 0.6,
      reason: criticalTasks.length > 0 ? 'Critical work exists; planning needs to stay explicit.' : 'No severe execution risk detected.',
      signals: criticalTasks.length > 0 ? ['tasks.critical_priority'] : ['context.no_major_risk'],
    });
  }

  return results.sort((a, b) => b.confidence - a.confidence).slice(0, 4);
};
