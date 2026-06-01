import { z } from 'zod';

export const submitReflectionSchema = z.object({
    date: z.string().datetime({ message: 'Invalid date format' }).optional(),
    mood: z.number().min(1).max(5),
    energyLevel: z.number().min(1).max(5),
    wins: z.array(z.string().max(200)).max(5).optional(),
    struggles: z.array(z.string().max(200)).max(5).optional(),
    honestAssessment: z.string().min(10, 'Be more honest with yourself').max(1000),
    excusesMade: z.array(z.string().max(200)).max(5).optional(),
    tomorrowPriority: z.string().min(1).max(200),
    tomorrowCommitmentTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)').optional(),
    productivityScore: z.number().min(0).max(100).optional(),
    disciplineScore: z.number().min(0).max(100).optional(),
});

export type SubmitReflectionInput = z.infer<typeof submitReflectionSchema>;
