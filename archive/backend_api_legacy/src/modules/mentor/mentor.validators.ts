import { z } from 'zod';

export const chatSchema = z.object({
    message: z
        .string()
        .min(1, 'Message is required')
        .max(2000, 'Message cannot exceed 2000 characters')
        .trim(),
    conversationId: z
        .string()
        .optional(),
    contextType: z
        .enum(['general', 'task_review', 'goal_planning', 'reflection', 'morning', 'crisis'])
        .optional(),
});

export type ChatInput = z.infer<typeof chatSchema>;
