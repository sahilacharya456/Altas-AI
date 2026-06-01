import { Request, Response, NextFunction } from 'express';
import { reflectionService } from './reflection.service.js';
import { sendSuccess, sendCreated } from '../../shared/utils/response.utils.js';
import { SubmitReflectionInput } from './reflection.validators.js';

export class ReflectionController {
    // Submit a reflection
    async submit(
        req: Request<unknown, unknown, SubmitReflectionInput>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const reflection = await reflectionService.submit(userId, req.body);
            sendCreated(res, reflection, 'Reflection recorded. Stay accountable.');
        } catch (error) {
            next(error);
        }
    }

    // Get reflection by date
    async getByDate(
        req: Request<{ date: string }>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const reflection = await reflectionService.getByDate(userId, req.params.date);
            sendSuccess(res, reflection);
        } catch (error) {
            next(error);
        }
    }

    // Get reflection history
    async getHistory(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
            const reflections = await reflectionService.getHistory(userId, days);
            sendSuccess(res, reflections);
        } catch (error) {
            next(error);
        }
    }

    // Get streak
    async getStreak(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const streak = await reflectionService.getStreak(userId);
            sendSuccess(res, { streak });
        } catch (error) {
            next(error);
        }
    }
}

export const reflectionController = new ReflectionController();
