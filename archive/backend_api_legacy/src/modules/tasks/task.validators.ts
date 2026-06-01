import { z } from 'zod';

export const createTaskSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title cannot exceed 200 characters')
        .trim(),
    description: z
        .string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .trim()
        .optional(),
    category: z
        .enum(['career', 'health', 'fitness', 'study', 'personal', 'routine'])
        .default('personal'),
    priority: z
        .enum(['low', 'medium', 'high', 'critical'])
        .default('medium'),
    scheduledDate: z
        .string()
        .datetime({ message: 'Invalid date format' })
        .or(z.date()),
    dueTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)')
        .optional(),
    estimatedMinutes: z
        .number()
        .min(5, 'Minimum 5 minutes')
        .max(480, 'Maximum 8 hours')
        .default(30),
    tags: z
        .array(z.string().trim().toLowerCase())
        .max(10, 'Maximum 10 tags')
        .optional(),
    goalId: z
        .string()
        .optional(),
});

export const updateTaskSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title cannot exceed 200 characters')
        .trim()
        .optional(),
    description: z
        .string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .trim()
        .optional()
        .nullable(),
    category: z
        .enum(['career', 'health', 'fitness', 'study', 'personal', 'routine'])
        .optional(),
    priority: z
        .enum(['low', 'medium', 'high', 'critical'])
        .optional(),
    scheduledDate: z
        .string()
        .datetime({ message: 'Invalid date format' })
        .or(z.date())
        .optional(),
    dueTime: z
        .string()
        .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)')
        .optional()
        .nullable(),
    estimatedMinutes: z
        .number()
        .min(5, 'Minimum 5 minutes')
        .max(480, 'Maximum 8 hours')
        .optional(),
    tags: z
        .array(z.string().trim().toLowerCase())
        .max(10, 'Maximum 10 tags')
        .optional(),
    status: z
        .enum(['pending', 'in_progress', 'completed', 'carried', 'cancelled'])
        .optional(),
});

export const completeTaskSchema = z.object({
    actualMinutes: z
        .number()
        .min(0, 'Cannot be negative')
        .optional(),
});

export const carryTaskSchema = z.object({
    newDate: z
        .string()
        .datetime({ message: 'Invalid date format' })
        .or(z.date()),
    splitIntoChunks: z
        .boolean()
        .optional(),
});

export const listTasksSchema = z.object({
    date: z
        .string()
        .datetime({ message: 'Invalid date format' })
        .optional(),
    startDate: z
        .string()
        .datetime({ message: 'Invalid date format' })
        .optional(),
    endDate: z
        .string()
        .datetime({ message: 'Invalid date format' })
        .optional(),
    status: z
        .enum(['pending', 'in_progress', 'completed', 'carried', 'cancelled'])
        .optional(),
    category: z
        .enum(['career', 'health', 'fitness', 'study', 'personal', 'routine'])
        .optional(),
    priority: z
        .enum(['low', 'medium', 'high', 'critical'])
        .optional(),
    goalId: z
        .string()
        .optional(),
    page: z
        .string()
        .transform(Number)
        .default('1'),
    limit: z
        .string()
        .transform(Number)
        .default('50'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type CarryTaskInput = z.infer<typeof carryTaskSchema>;
export type ListTasksInput = z.infer<typeof listTasksSchema>;
