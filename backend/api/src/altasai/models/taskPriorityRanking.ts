import type { RankedTask } from '../core/types';

const priorityWeight: Record<string, number> = { low: 10, medium: 25, high: 45, critical: 65 };

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return value.toDate();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const rankTasks = (tasks: Array<Record<string, unknown>>, now = new Date()): RankedTask[] => tasks
  .filter((task) => !['completed', 'cancelled'].includes(String(task.status ?? 'pending')))
  .map((task) => {
    const due = toDate(task.scheduledDate ?? task.deadline ?? task.dueDate);
    const hoursLeft = due ? (due.getTime() - now.getTime()) / 3_600_000 : null;
    const overdueBoost = hoursLeft !== null && hoursLeft < 0 ? 35 : 0;
    const urgency = hoursLeft === null ? 10 : hoursLeft < 12 ? 30 : hoursLeft < 48 ? 20 : 8;
    const carryPenalty = Number(task.carryCount ?? 0) * 8;
    const effortPenalty = Math.min(20, Number(task.estimatedMinutes ?? 30) / 8);
    const score = Math.round(Math.min(100, (priorityWeight[String(task.priority ?? 'medium')] ?? 25) + urgency + overdueBoost + carryPenalty - effortPenalty));
    const title = String(task.title ?? 'Untitled task');
    return {
      title,
      score,
      reason: due && hoursLeft !== null && hoursLeft < 0 ? 'Overdue high-pressure task.' : 'Ranked by urgency, priority, carry debt, and estimated effort.',
      evidence: [`priority=${String(task.priority ?? 'medium')}`, `hoursLeft=${hoursLeft === null ? 'none' : hoursLeft.toFixed(1)}`, `carryCount=${Number(task.carryCount ?? 0)}`],
      nextAction: `Start: ${title}`,
    };
  })
  .sort((a, b) => b.score - a.score);
