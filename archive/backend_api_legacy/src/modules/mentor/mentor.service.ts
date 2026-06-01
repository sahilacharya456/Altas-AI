import mongoose, { Types } from 'mongoose';
import { Conversation, IConversation, IMessage } from './conversation.model.js';
import { User } from '../users/user.model.js';
import { Task } from '../tasks/task.model.js';
import { genAI, GEMINI_CONFIG } from '../../config/gemini.js';
import { DisciplineLevel } from '../../config/openai.js';
import { buildSystemPrompt, buildUserContext, CONTEXT_TEMPLATES } from './mentor.prompts.js';
import { NotFoundError, BadRequestError } from '../../shared/errors/AppError.js';
import { startOfDay, endOfDay, subDays } from 'date-fns';

interface ChatInput {
    message: string;
    conversationId?: string;
    contextType?: IConversation['contextType'];
}

interface ChatResponse {
    response: string;
    conversationId: string;
}

export class MentorService {
    // Send a message to the mentor and get response
    async chat(userId: string, input: ChatInput): Promise<ChatResponse> {
        // RESILIENT DB-LESS FALLBACK: If MongoDB is down, answer stateless using Gemini
        const isDbConnected = mongoose.connection.readyState === 1;

        if (!isDbConnected) {
            console.warn('[Mentor Service] Database is down. Operating in resilient DB-less/mock mode.');
            
            // Invoke Gemini directly with no DB conversation context
            const response = await genAI.models.generateContent({
                model: GEMINI_CONFIG.model,
                contents: input.message,
                config: {
                    systemInstruction: `IDENTITY: You are ATLAS, a high-performance lifestyle architect.
STYLE: Concise, insightful, empathetic but firm.
DIRECTIVE: Focus on actionable advice. Keep replies brief.
Note: You are currently running in DB-less/offline mode, so you cannot see past conversation history. Help the user map their next micro-action.`,
                    temperature: GEMINI_CONFIG.temperature,
                    maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
                }
            });

            return {
                response: response.text?.trim() || 'Focus on your commitments. What is your next move?',
                conversationId: input.conversationId || 'mock-db-less-session',
            };
        }

        const userObjectId = new Types.ObjectId(userId);

        // Get or create conversation
        let conversation: IConversation;

        if (input.conversationId) {
            const existing = await Conversation.findOne({
                _id: input.conversationId,
                userId: userObjectId,
            });

            if (!existing) {
                throw NotFoundError('Conversation not found');
            }
            conversation = existing;
        } else {
            conversation = await Conversation.create({
                userId: userObjectId,
                contextType: input.contextType || 'general',
                messages: [],
            });
        }

        // Get user data for context
        const user = await User.findById(userId);
        if (!user) {
            throw NotFoundError('User not found');
        }

        // Get user's task data for enhanced context
        const userContext = await this.buildUserContextData(userId);

        // Build appropriate context based on conversation type
        let additionalContext = '';
        if (conversation.contextType === 'task_review') {
            additionalContext = await this.getTaskReviewContext(userId);
        } else if (conversation.contextType === 'morning') {
            additionalContext = await this.getMorningContext(userId);
        }

        // Build system prompt
        const disciplineLevel = user.disciplineLevel as DisciplineLevel || 'strict';
        const systemPrompt = buildSystemPrompt(
            disciplineLevel,
            buildUserContext(userContext) + additionalContext
        );

        // Add user message to conversation
        const userMessage: IMessage = {
            role: 'user',
            content: input.message,
            timestamp: new Date(),
        };
        conversation.messages.push(userMessage);

        // Call Gemini
        const response = await genAI.models.generateContent({
            model: GEMINI_CONFIG.model,
            contents: conversation.messages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            })),
            config: {
                systemInstruction: systemPrompt,
                temperature: GEMINI_CONFIG.temperature,
                maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
            }
        });

        const assistantResponse = response.text?.trim() || 'I have nothing to say.';

        // Add assistant response to conversation
        const assistantMessage: IMessage = {
            role: 'assistant',
            content: assistantResponse,
            timestamp: new Date(),
            context: conversation.contextType,
        };
        conversation.messages.push(assistantMessage);
        conversation.lastMessageAt = new Date();

        await conversation.save();

        return {
            response: assistantResponse,
            conversationId: conversation._id.toString(),
        };
    }

    // Get user context data for prompts
    private async buildUserContextData(userId: string): Promise<{
        displayName: string;
        disciplineScore: number;
        currentStreak: number;
        todayCompleted: number;
        todayTotal: number;
        weeklyCompletionRate: number;
        carryPatterns: string[];
    }> {
        const user = await User.findById(userId);
        if (!user) throw NotFoundError('User not found');

        const today = new Date();
        const weekAgo = subDays(today, 7);

        // Get today's tasks
        const todayTasks = await Task.find({
            userId: new Types.ObjectId(userId),
            scheduledDate: { $gte: startOfDay(today), $lte: endOfDay(today) },
        }).lean();

        // Get week's tasks for completion rate
        const weekTasks = await Task.find({
            userId: new Types.ObjectId(userId),
            scheduledDate: { $gte: startOfDay(weekAgo), $lte: endOfDay(today) },
        }).lean();

        const todayCompleted = todayTasks.filter(t => t.status === 'completed').length;
        const weekCompleted = weekTasks.filter(t => t.status === 'completed').length;

        // Detect carry patterns
        const carriedTasks = await Task.find({
            userId: new Types.ObjectId(userId),
            isCarried: true,
            scheduledDate: { $gte: startOfDay(weekAgo) },
        }).lean();

        const carryPatterns: string[] = [];
        if (carriedTasks.length > 3) {
            const categories = carriedTasks.map(t => t.category);
            const categoryCount: Record<string, number> = {};
            categories.forEach(c => { categoryCount[c] = (categoryCount[c] || 0) + 1; });

            Object.entries(categoryCount).forEach(([cat, count]) => {
                if (count >= 2) {
                    carryPatterns.push(`Frequent carries in "${cat}" category`);
                }
            });
        }

        return {
            displayName: user.displayName,
            disciplineScore: user.currentScores?.discipline || 50,
            currentStreak: 0, // TODO: Calculate from streak tracking
            todayCompleted,
            todayTotal: todayTasks.length,
            weeklyCompletionRate: weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0,
            carryPatterns,
        };
    }

    // Get context for task review conversations
    private async getTaskReviewContext(userId: string): Promise<string> {
        const yesterday = subDays(new Date(), 1);

        const incompleteTasks = await Task.find({
            userId: new Types.ObjectId(userId),
            scheduledDate: { $gte: startOfDay(yesterday), $lte: endOfDay(yesterday) },
            status: { $in: ['pending', 'in_progress'] },
        }).lean();

        if (incompleteTasks.length === 0) return '';

        const patterns: string[] = [];
        const categories = incompleteTasks.map(t => t.category);
        const uniqueCategories = [...new Set(categories)];
        if (uniqueCategories.length === 1) {
            patterns.push(`All missed tasks are in "${uniqueCategories[0]}" category`);
        }

        return CONTEXT_TEMPLATES.missedTasks(incompleteTasks.length, patterns);
    }

    // Get context for morning check-in
    private async getMorningContext(userId: string): Promise<string> {
        const today = new Date();

        const todayTasks = await Task.find({
            userId: new Types.ObjectId(userId),
            scheduledDate: { $gte: startOfDay(today), $lte: endOfDay(today) },
        }).lean();

        const carryOvers = todayTasks.filter(t => t.isCarried).length;

        return CONTEXT_TEMPLATES.morningCheckin(todayTasks.length, carryOvers);
    }

    // List user conversations
    async listConversations(userId: string, limit = 20): Promise<IConversation[]> {
        if (mongoose.connection.readyState !== 1) {
            console.warn('[Mentor Service] DB offline. Returning empty conversation list.');
            return [];
        }
        return Conversation.find({
            userId: new Types.ObjectId(userId),
            isActive: true,
        })
            .select('title contextType lastMessageAt createdAt')
            .sort({ lastMessageAt: -1 })
            .limit(limit)
            .lean() as unknown as IConversation[];
    }

    // Get conversation by ID
    async getConversation(userId: string, conversationId: string): Promise<IConversation> {
        if (mongoose.connection.readyState !== 1) {
            throw NotFoundError('Conversation not found (Database offline)');
        }
        const conversation = await Conversation.findOne({
            _id: conversationId,
            userId: new Types.ObjectId(userId),
        });

        if (!conversation) {
            throw NotFoundError('Conversation not found');
        }

        return conversation;
    }

    // Delete/archive conversation
    async deleteConversation(userId: string, conversationId: string): Promise<void> {
        if (mongoose.connection.readyState !== 1) {
            console.warn('[Mentor Service] DB offline. Skipping conversation deletion.');
            return;
        }
        const conversation = await this.getConversation(userId, conversationId);
        conversation.isActive = false;
        await conversation.save();
    }
}

export const mentorService = new MentorService();
