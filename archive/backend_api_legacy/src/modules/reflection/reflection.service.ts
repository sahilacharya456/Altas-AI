import mongoose, { Types } from 'mongoose';
import { Reflection, IReflection } from './reflection.model.js';
import { Task } from '../tasks/task.model.js';
import { User } from '../users/user.model.js';
import { genAI, GEMINI_CONFIG } from '../../config/gemini.js';
import { DisciplineLevel } from '../../config/openai.js';
import { NotFoundError, ConflictError } from '../../shared/errors/AppError.js';
import { SubmitReflectionInput } from './reflection.validators.js';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export class ReflectionService {
    // Submit a reflection
    async submit(userId: string, data: SubmitReflectionInput): Promise<IReflection> {
        const userObjectId = new Types.ObjectId(userId);
        const reflectionDate = data.date ? new Date(data.date) : new Date();
        const dateStart = startOfDay(reflectionDate);

        // Check if reflection already exists for this date
        const existing = await Reflection.findOne({
            userId: userObjectId,
            date: { $gte: dateStart, $lte: endOfDay(reflectionDate) },
        });

        if (existing) {
            throw ConflictError('You have already submitted a reflection for this date');
        }

        // Get user for discipline level
        const user = await User.findById(userId);
        if (!user) throw NotFoundError('User not found');

        // Get task stats for the day
        const taskStats = await this.getTaskStats(userId, reflectionDate);

        // Create reflection
        const reflection = await Reflection.create({
            userId: userObjectId,
            date: dateStart,
            ...data,
            tasksCompleted: taskStats.completed,
            tasksMissed: taskStats.missed,
            tasksCarried: taskStats.carried,
            focusMinutes: taskStats.focusMinutes,
        });

        // Generate AI mentor feedback
        const feedback = await this.generateMentorFeedback(reflection, user.disciplineLevel as DisciplineLevel);
        reflection.mentorFeedback = feedback;
        await reflection.save();

        // Update user's discipline score based on reflection
        await this.updateUserScores(userId, reflection);

        return reflection;
    }

    // Get task stats for a given day
    private async getTaskStats(userId: string, date: Date): Promise<{
        completed: number;
        missed: number;
        carried: number;
        focusMinutes: number;
    }> {
        const tasks = await Task.find({
            userId: new Types.ObjectId(userId),
            scheduledDate: { $gte: startOfDay(date), $lte: endOfDay(date) },
        }).lean();

        const completed = tasks.filter((t: { status: string }) => t.status === 'completed').length;
        const missed = tasks.filter((t: { status: string }) => t.status === 'pending' || t.status === 'in_progress').length;
        const carried = tasks.filter((t: { isCarried?: boolean }) => t.isCarried).length;
        const focusMinutes = tasks
            .filter((t: { status: string }) => t.status === 'completed')
            .reduce((sum: number, t: { actualMinutes?: number; estimatedMinutes?: number }) =>
                sum + (t.actualMinutes || t.estimatedMinutes || 0), 0);

        return { completed, missed, carried, focusMinutes };
    }

    // Generate AI mentor feedback based on reflection
    private async generateMentorFeedback(reflection: IReflection, disciplineLevel: DisciplineLevel): Promise<string> {
        const prompt = `You are ATLAS, a strict AI mentor. The user just submitted their night reflection. Give brief, pointed feedback (max 100 words).

DISCIPLINE LEVEL: ${disciplineLevel.toUpperCase()}

USER'S REFLECTION:
- Mood: ${reflection.mood}/5
- Energy: ${reflection.energyLevel}/5
- Tasks: ${reflection.tasksCompleted} completed, ${reflection.tasksMissed} missed, ${reflection.tasksCarried} carried over
- Wins: ${reflection.wins?.join(', ') || 'None listed'}
- Struggles: ${reflection.struggles?.join(', ') || 'None listed'}
- Excuses made: ${reflection.excusesMade?.join(', ') || 'None admitted'}
- Honest assessment: "${reflection.honestAssessment}"
- Tomorrow's priority: "${reflection.tomorrowPriority}"
- Self-rated productivity: ${reflection.productivityScore || 'Not rated'}%

Give direct feedback on their day and hold them accountable for tomorrow's commitment.`;

        try {
            const response = await genAI.models.generateContent({
                model: GEMINI_CONFIG.model,
                contents: prompt,
                config: {
                    temperature: 0.8,
                    maxOutputTokens: 250,
                }
            });

            return response.text?.trim() || 'Stay focused tomorrow.';
        } catch (error) {
            console.error('[Reflection Service] Gemini feedback generation error:', error);
            return 'Stay focused tomorrow. Your commitment to reflect is noted.';
        }
    }

    // Update user scores based on reflection
    private async updateUserScores(userId: string, reflection: IReflection): Promise<void> {
        const user = await User.findById(userId);
        if (!user) return;

        // Calculate weighted discipline score
        const taskScore = reflection.tasksCompleted > 0
            ? (reflection.tasksCompleted / (reflection.tasksCompleted + reflection.tasksMissed)) * 100
            : 0;

        const carryPenalty = reflection.tasksCarried * 5; // -5 points per carried task
        const reflectionBonus = 5; // Bonus for actually reflecting

        let newDisciplineScore = Math.round(
            (user.currentScores.discipline * 0.7) + // 70% historical
            ((taskScore - carryPenalty + reflectionBonus) * 0.3) // 30% today
        );

        // Clamp between 0 and 100
        newDisciplineScore = Math.max(0, Math.min(100, newDisciplineScore));

        user.currentScores.discipline = newDisciplineScore;
        user.currentScores.lastUpdated = new Date();
        await user.save();
    }

    // Get reflection for a specific date
    async getByDate(userId: string, date: string): Promise<IReflection | null> {
        const targetDate = new Date(date);
        return Reflection.findOne({
            userId: new Types.ObjectId(userId),
            date: { $gte: startOfDay(targetDate), $lte: endOfDay(targetDate) },
        });
    }

    // Get reflection history
    async getHistory(userId: string, days = 30): Promise<IReflection[]> {
        const startDate = subDays(new Date(), days);
        return Reflection.find({
            userId: new Types.ObjectId(userId),
            date: { $gte: startOfDay(startDate) },
        })
            .sort({ date: -1 })
            .lean() as unknown as IReflection[];
    }

    // Get reflection streak
    async getStreak(userId: string): Promise<number> {
        const reflections = await Reflection.find({
            userId: new Types.ObjectId(userId),
        })
            .sort({ date: -1 })
            .select('date')
            .lean();

        if (reflections.length === 0) return 0;

        let streak = 0;
        let currentDate = startOfDay(new Date());

        for (const reflection of reflections) {
            const reflectionDate = startOfDay(new Date(reflection.date));
            const expectedDate = startOfDay(subDays(currentDate, streak));

            if (format(reflectionDate, 'yyyy-MM-dd') === format(expectedDate, 'yyyy-MM-dd')) {
                streak++;
            } else if (streak === 0 && format(reflectionDate, 'yyyy-MM-dd') === format(subDays(currentDate, 1), 'yyyy-MM-dd')) {
                // Allow for checking yesterday if today not yet reflected
                streak++;
                currentDate = subDays(currentDate, 1);
            } else {
                break;
            }
        }

        return streak;
    }
}

export const reflectionService = new ReflectionService();
