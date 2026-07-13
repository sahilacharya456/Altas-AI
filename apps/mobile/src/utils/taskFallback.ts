import { Timestamp } from 'firebase/firestore';
import type { Task } from '../types/firestore';

export type TaskCreateInput = Omit<
    Task,
    'id' | 'createdAt' | 'updatedAt' | 'isCarried' | 'carryCount' | 'scheduledDate'
> & {
    scheduledDate: Date | Timestamp;
};

const toTimestamp = (value: Date | Timestamp): Timestamp => {
    if (value instanceof Date) {
        return Timestamp.fromDate(value);
    }

    return value;
};

export const isTaskCreateLocalFallbackError = (error: unknown): boolean => {
    if (!(error instanceof Error)) return false;

    const message = error.message.toLowerCase();
    return (
        message.includes('missing or insufficient permissions') ||
        message.includes('network') ||
        message.includes('offline') ||
        message.includes('unavailable')
    );
};

export const buildLocalTaskFallback = (
    taskData: TaskCreateInput,
    taskId = `local_${Date.now()}`,
    now = Timestamp.now()
): Task => ({
    id: taskId,
    userId: taskData.userId,
    title: taskData.title,
    description: taskData.description ?? '',
    category: taskData.category,
    priority: taskData.priority,
    status: taskData.status ?? 'pending',
    estimatedMinutes: taskData.estimatedMinutes,
    scheduledDate: toTimestamp(taskData.scheduledDate),
    tags: taskData.tags ?? [],
    isCarried: false,
    carryCount: 0,
    createdAt: now,
    updatedAt: now,
    source: taskData.source ?? 'manual',
    context: taskData.context,
    goalId: taskData.goalId,
});
