import type { Task } from '../types/firestore';

export interface TaskSummary {
  total: number;
  completed: number;
  pending: number;
  carried: number;
  completionRate: number;
}

type SummaryTask = Pick<Task, 'status' | 'isCarried'>;

export const buildTaskSummary = (tasks: SummaryTask[]): TaskSummary => {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const pending = tasks.filter((task) => task.status === 'pending' || task.status === 'in_progress').length;
  const carried = tasks.filter((task) => task.isCarried || task.status === 'carried').length;

  return {
    total,
    completed,
    pending,
    carried,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
};
