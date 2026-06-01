/**
 * Tasks Data Service
 * Firestore operations for tasks collection
 */

import {
    addDocument,
    getDocument,
    updateDocument,
    deleteDocument,
    queryCollection,
    subscribeToCollection,
    where,
    orderBy,
    Timestamp,
} from '../firebase';
import { Task } from '../../types/firestore';

const COLLECTION = 'tasks';

const getMillis = (value: Task['scheduledDate']): number => {
    if (value && typeof value === 'object' && 'toDate' in value) {
        return value.toDate().getTime();
    }
    return new Date(value as unknown as Date).getTime();
};

/**
 * Create a new task
 */
export const createTask = async (
    data: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isCarried' | 'carryCount'>
): Promise<string> => {
    return addDocument<Task>(COLLECTION, {
        ...data,
        isCarried: false,
        carryCount: 0,
        scheduledDate: data.scheduledDate,
        status: data.status || 'pending',
        source: data.source || 'manual',
    } as Omit<Task, 'id'>);
};

/**
 * Get a task by ID
 */
export const getTask = async (taskId: string): Promise<Task | null> => {
    return getDocument<Task>(`${COLLECTION}/${taskId}`);
};

/**
 * Update a task
 */
export const updateTask = async (
    taskId: string,
    data: Partial<Task>
): Promise<void> => {
    return updateDocument(`${COLLECTION}/${taskId}`, data);
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId: string): Promise<void> => {
    return deleteDocument(`${COLLECTION}/${taskId}`);
};

/**
 * Complete a task
 */
export const completeTask = async (
    taskId: string,
    actualMinutes?: number
): Promise<void> => {
    return updateDocument(`${COLLECTION}/${taskId}`, {
        status: 'completed',
        completedAt: Timestamp.now(),
        ...(actualMinutes !== undefined && { actualMinutes }),
    });
};

export const startTask = async (taskId: string): Promise<void> => {
    return updateDocument(`${COLLECTION}/${taskId}`, {
        status: 'in_progress',
        startedAt: Timestamp.now(),
    });
};

export const cancelTask = async (taskId: string): Promise<void> => {
    return updateDocument(`${COLLECTION}/${taskId}`, {
        status: 'cancelled',
    });
};

/**
 * Carry a task to a new date
 */
export const carryTask = async (
    taskId: string,
    newDate: Date
): Promise<void> => {
    const task = await getTask(taskId);
    if (!task) throw new Error('Task not found');

    if (task.carryCount >= 3) {
        throw new Error('Task has been carried 3 times. Complete it or mark as cancelled.');
    }

    return updateDocument(`${COLLECTION}/${taskId}`, {
        scheduledDate: Timestamp.fromDate(newDate),
        isCarried: true,
        carryCount: task.carryCount + 1,
        originalDate: task.originalDate || task.scheduledDate,
        status: 'pending',
    });
};

/**
 * Get tasks for a specific date
 */
export const getTasksForDate = async (userId: string, date: Date): Promise<Task[]> => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return queryCollection<Task>(COLLECTION, [
        where('scheduledDate', '>=', Timestamp.fromDate(startOfDay)),
        where('scheduledDate', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('scheduledDate', 'asc'),
    ]);
};

/**
 * Get today's tasks
 */
export const getTodaysTasks = async (userId: string): Promise<Task[]> => {
    return getTasksForDate(userId, new Date());
};

/**
 * Subscribe to today's tasks (real-time)
 */
export const subscribeToTodaysTasks = (
    userId: string,
    callback: (tasks: Task[]) => void
): (() => void) => {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return subscribeToCollection<Task>(COLLECTION, callback, [
        where('scheduledDate', '>=', Timestamp.fromDate(startOfDay)),
        where('scheduledDate', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('scheduledDate', 'asc'),
    ]);
};

/**
 * Get task summary for a date
 */
export const getTaskSummary = async (userId: string, date: Date): Promise<{
    total: number;
    completed: number;
    pending: number;
    carried: number;
    completionRate: number;
}> => {
    const tasks = await getTasksForDate(userId, date);

    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    const carried = tasks.filter(t => t.status === 'carried').length;
    const total = tasks.length;

    return {
        total,
        completed,
        pending,
        carried,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
};

/**
 * Get tasks by status
 */
export const getTasksByStatus = async (
    userId: string,
    status: Task['status']
): Promise<Task[]> => {
    const tasks = await queryCollection<Task>(COLLECTION, [
        where('status', '==', status),
    ]);
    return tasks.sort((a, b) => getMillis(b.scheduledDate) - getMillis(a.scheduledDate));
};

/**
 * Get carried tasks (tasks that have been postponed)
 */
export const getCarriedTasks = async (_userId: string): Promise<Task[]> => {
    const tasks = await queryCollection<Task>(COLLECTION, [
        where('status', '==', 'pending'),
    ]);
    return tasks
        .filter((task) => task.isCarried)
        .sort((a, b) => getMillis(a.scheduledDate) - getMillis(b.scheduledDate));
};
