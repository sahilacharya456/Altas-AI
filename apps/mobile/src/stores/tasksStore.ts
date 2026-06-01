/**
 * Tasks Store - Firestore Version
 * Zustand store for tasks state with real-time Firestore sync
 */

import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';
import {
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    startTask,
    cancelTask,
    carryTask,
    getTasksForDate,
    subscribeToTodaysTasks,
    getTaskSummary,
    getCarriedTasks,
} from '../services/data';
import { Task } from '../types/firestore';
import { NotificationService } from '../services/notifications';
import { convertToDate } from '../utils/dateUtils';
import { validateTask } from '../utils/validation';

interface TasksState {
    // State
    userId: string | null;
    tasks: Task[];
    carriedTasks: Task[];
    selectedDate: Date;
    summary: {
        total: number;
        completed: number;
        pending: number;
        carried: number;
        completionRate: number;
    };
    isLoading: boolean;
    error: string | null;

    // Actions
    initialize: (userId: string) => () => void; // Returns unsubscribe function
    loadTasksForDate: (date: Date) => Promise<void>;
    loadCarriedTasks: () => Promise<void>;
    setSelectedDate: (date: Date) => void;
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'isCarried' | 'carryCount' | 'scheduledDate'> & { scheduledDate: Date }) => Promise<string>;
    editTask: (taskId: string, data: Partial<Task>) => Promise<void>;
    removeTask: (taskId: string) => Promise<void>;
    markComplete: (taskId: string, actualMinutes?: number) => Promise<void>;
    start: (taskId: string) => Promise<void>;
    cancel: (taskId: string) => Promise<void>;
    carry: (taskId: string, newDate: Date) => Promise<void>;
    refreshSummary: () => Promise<void>;
    clearError: () => void;
}


export const useTasksStore = create<TasksState>((set, get) => ({
    // Initial state
    userId: null,
    tasks: [],
    carriedTasks: [],
    selectedDate: new Date(),
    summary: {
        total: 0,
        completed: 0,
        pending: 0,
        carried: 0,
        completionRate: 0,
    },
    isLoading: false,
    error: null,

    // Initialize with real-time subscription to today's tasks
    initialize: (userId: string) => {
        set({ isLoading: true, userId });

        // Subscribe to today's tasks
        const unsubscribe = subscribeToTodaysTasks(
            userId,
            (tasks) => {
                set({ tasks, isLoading: false, error: null });

                // Update summary
                const completed = tasks.filter(t => t.status === 'completed').length;
                const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
                const carried = tasks.filter(t => t.status === 'carried').length;
                const total = tasks.length;

                set({
                    summary: {
                        total,
                        completed,
                        pending,
                        carried,
                        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
                    },
                });
            },
            (error) => {
                const message = error instanceof Error ? error.message : 'Failed to load tasks';
                set({ error: message, isLoading: false });
            }
        );

        // Load carried tasks
        get().loadCarriedTasks();

        return unsubscribe;
    },

    // Load tasks for a specific date
    loadTasksForDate: async (date: Date) => {
        const { userId } = get();
        if (!userId) return;

        try {
            set({ isLoading: true, error: null, selectedDate: date });
            const tasks = await getTasksForDate(userId, date);
            set({ tasks, isLoading: false });

            // Update summary
            const summary = await getTaskSummary(userId, date);
            set({ summary });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load tasks';
            set({ error: message, isLoading: false });
        }
    },

    // Load carried tasks (tasks that have been postponed)
    loadCarriedTasks: async () => {
        const { userId } = get();
        if (!userId) return;

        try {
            const carriedTasks = await getCarriedTasks(userId);
            set({ carriedTasks });
        } catch (error) {
            // Silent fail - carried tasks are not critical
        }
    },

    // Set selected date and reload tasks
    setSelectedDate: (date: Date) => {
        set({ selectedDate: date });
        get().loadTasksForDate(date);
    },

    // Add a new task
    addTask: async (taskData) => {
        try {
            // Validate input
            validateTask(taskData);

            set({ isLoading: true, error: null });

            // Convert Date to Timestamp for Firestore if needed (though addDocument handles Date objects usually, 
            // but for type safety with our interface update):
            const dataToSave = {
                ...taskData,
                scheduledDate: Timestamp.fromDate(taskData.scheduledDate instanceof Date ? taskData.scheduledDate : (taskData.scheduledDate as any).toDate()),
            };

            const taskId = await createTask(dataToSave as any);

            // Reload tasks for current date
            await get().loadTasksForDate(get().selectedDate);

            set({ isLoading: false });

            // Schedule notification if time is set
            if (taskData.scheduledDate) {
                const date = convertToDate(taskData.scheduledDate);
                NotificationService.scheduleTaskReminder(taskId, taskData.title, date);
            }

            return taskId;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create task';
            set({ error: message, isLoading: false });
            throw error;
        }
    },


    // Edit a task
    editTask: async (taskId, data) => {
        try {
            set({ isLoading: true, error: null });
            await updateTask(taskId, data);

            // Handle Notification Updates
            const currentTask = get().tasks.find(t => t.id === taskId);
            if (currentTask) {
                if (data.status === 'completed') {
                    NotificationService.cancelTaskReminder(taskId);
                } else if (data.scheduledDate || data.title) {
                    const scheduledDate = data.scheduledDate || currentTask.scheduledDate;
                    const title = data.title || currentTask.title;

                    if (scheduledDate) {
                        const date = convertToDate(scheduledDate);

                        if (date > new Date()) {
                            NotificationService.scheduleTaskReminder(taskId, title, date);
                        }
                    }
                }
            }

            // Realtime subscription will update the list
            set({ isLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update task';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    // Remove a task
    removeTask: async (taskId) => {
        try {
            set({ isLoading: true, error: null });
            await deleteTask(taskId);
            NotificationService.cancelTaskReminder(taskId);

            // Realtime subscription will update the list
            set({ isLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete task';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    // Mark task as complete
    markComplete: async (taskId, actualMinutes) => {
        try {
            set({ error: null });
            await completeTask(taskId, actualMinutes);
            NotificationService.cancelTaskReminder(taskId);

            // Realtime subscription will update the list
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to complete task';
            set({ error: message });
            throw error;
        }
    },

    start: async (taskId) => {
        try {
            set({ error: null });
            await startTask(taskId);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to start task';
            set({ error: message });
            throw error;
        }
    },

    cancel: async (taskId) => {
        try {
            set({ error: null });
            await cancelTask(taskId);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to cancel task';
            set({ error: message });
            throw error;
        }
    },

    // Carry task to a new date
    carry: async (taskId, newDate) => {
        try {
            set({ error: null });
            await carryTask(taskId, newDate);

            // Realtime subscription will update the list
            // Also reload carried tasks list
            await get().loadCarriedTasks();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to carry task';
            set({ error: message });
            throw error;
        }
    },

    // Refresh summary for current date
    refreshSummary: async () => {
        const { userId } = get();
        if (!userId) return;

        try {
            const summary = await getTaskSummary(userId, get().selectedDate);
            set({ summary });
        } catch (error) {
            // Silent fail - summary refresh is not critical
        }
    },

    // Clear error
    clearError: () => set({ error: null }),
}));

// Selectors
export const selectTodaysSummary = (state: TasksState) => state.summary;
export const selectPendingTasks = (state: TasksState) =>
    state.tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
export const selectCompletedTasks = (state: TasksState) =>
    state.tasks.filter(t => t.status === 'completed');
export const selectCarriedTasks = (state: TasksState) => state.carriedTasks;
