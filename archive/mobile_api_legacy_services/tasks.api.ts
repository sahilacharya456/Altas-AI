import apiClient, { extractData } from './client';
import { API_ENDPOINTS } from '../../constants/api';

// Types
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'carried' | 'cancelled';
export type TaskCategory = 'career' | 'health' | 'fitness' | 'study' | 'personal' | 'routine';

export interface Task {
    id: string;
    title: string;
    description?: string;
    category: TaskCategory;
    priority: TaskPriority;
    status: TaskStatus;
    scheduledDate: string;
    dueTime?: string;
    estimatedMinutes: number;
    actualMinutes?: number;
    completedAt?: string;
    isCarried: boolean;
    carryCount: number;
    originalDate?: string;
    tags: string[];
    goalId?: string;
    isAIGenerated: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskInput {
    title: string;
    description?: string;
    category?: TaskCategory;
    priority?: TaskPriority;
    scheduledDate: string;
    dueTime?: string;
    estimatedMinutes?: number;
    tags?: string[];
    goalId?: string;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string | null;
    category?: TaskCategory;
    priority?: TaskPriority;
    scheduledDate?: string;
    dueTime?: string | null;
    estimatedMinutes?: number;
    tags?: string[];
    status?: TaskStatus;
}

export interface TaskListFilters {
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: TaskStatus;
    category?: TaskCategory;
    priority?: TaskPriority;
    goalId?: string;
    page?: number;
    limit?: number;
}

export interface TaskListResponse {
    tasks: Task[];
    total: number;
    page: number;
    totalPages: number;
}

export interface TodaySummary {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    carried: number;
    completionRate: number;
}

// API Functions
export const tasksApi = {
    // List tasks with filters
    list: async (filters?: TaskListFilters): Promise<TaskListResponse> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined) params.append(key, String(value));
            });
        }
        const response = await apiClient.get(`${API_ENDPOINTS.TASKS.LIST}?${params.toString()}`);
        return extractData(response);
    },

    // Get today's summary
    getTodaySummary: async (): Promise<TodaySummary> => {
        const response = await apiClient.get(API_ENDPOINTS.TASKS.SUMMARY_TODAY);
        return extractData(response);
    },

    // Create task
    create: async (data: CreateTaskInput): Promise<Task> => {
        const response = await apiClient.post(API_ENDPOINTS.TASKS.CREATE, data);
        return extractData(response);
    },

    // Get task by ID
    getById: async (id: string): Promise<Task> => {
        const response = await apiClient.get(API_ENDPOINTS.TASKS.GET(id));
        return extractData(response);
    },

    // Update task
    update: async (id: string, data: UpdateTaskInput): Promise<Task> => {
        const response = await apiClient.patch(API_ENDPOINTS.TASKS.UPDATE(id), data);
        return extractData(response);
    },

    // Delete task
    delete: async (id: string): Promise<void> => {
        await apiClient.delete(API_ENDPOINTS.TASKS.DELETE(id));
    },

    // Complete task
    complete: async (id: string, actualMinutes?: number): Promise<Task> => {
        const response = await apiClient.post(API_ENDPOINTS.TASKS.COMPLETE(id), { actualMinutes });
        return extractData(response);
    },

    // Carry task to new date
    carry: async (id: string, newDate: string, splitIntoChunks?: boolean): Promise<Task | Task[]> => {
        const response = await apiClient.post(API_ENDPOINTS.TASKS.CARRY(id), { newDate, splitIntoChunks });
        return extractData(response);
    },
};
