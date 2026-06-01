import { Request, Response, NextFunction } from 'express';
import { mentorService } from './mentor.service.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.utils.js';
import { ChatInput } from './mentor.validators.js';

export class MentorController {
    // Send message to mentor
    async chat(
        req: Request<unknown, unknown, ChatInput>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const result = await mentorService.chat(userId, req.body);
            sendCreated(res, result);
        } catch (error) {
            next(error);
        }
    }

    // List conversations
    async listConversations(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
            const conversations = await mentorService.listConversations(userId, limit);
            sendSuccess(res, conversations);
        } catch (error) {
            next(error);
        }
    }

    // Get single conversation
    async getConversation(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const conversation = await mentorService.getConversation(userId, req.params.id);
            sendSuccess(res, conversation);
        } catch (error) {
            next(error);
        }
    }

    // Delete conversation
    async deleteConversation(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            await mentorService.deleteConversation(userId, req.params.id);
            sendSuccess(res, null, 'Conversation deleted');
        } catch (error) {
            next(error);
        }
    }
}

export const mentorController = new MentorController();
