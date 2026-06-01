import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service.js';
import { sendSuccess } from '../../shared/utils/response.utils.js';

export class AnalyticsController {
    // Get analytics summary (dashboard)
    async getSummary(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const summary = await analyticsService.getSummary(userId);
            sendSuccess(res, summary);
        } catch (error) {
            next(error);
        }
    }

    // Get daily breakdown for charts
    async getDailyBreakdown(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
            const stats = await analyticsService.getDailyBreakdown(userId, days);
            sendSuccess(res, stats);
        } catch (error) {
            next(error);
        }
    }
}

export const analyticsController = new AnalyticsController();
