import { Request, Response, NextFunction } from 'express';
import { taskService } from './task.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../../shared/utils/response.utils.js';
import {
    CreateTaskInput,
    UpdateTaskInput,
    CompleteTaskInput,
    CarryTaskInput,
    ListTasksInput,
} from './task.validators.js';

export class TaskController {
    // Create task
    async create(
        req: Request<unknown, unknown, CreateTaskInput>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const task = await taskService.create(userId, req.body);
            sendCreated(res, task, 'Task created successfully');
        } catch (error) {
            next(error);
        }
    }

    // Get task by ID
    async getById(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const task = await taskService.getById(userId, req.params.id);
            sendSuccess(res, task);
        } catch (error) {
            next(error);
        }
    }

    // List tasks
    async list(
        req: Request<unknown, unknown, unknown, Partial<ListTasksInput>>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const result = await taskService.list(userId, req.query as ListTasksInput);
            sendPaginated(res, result.tasks, result.page, req.query.limit || 50, result.total);
        } catch (error) {
            next(error);
        }
    }

    // Update task
    async update(
        req: Request<{ id: string }, unknown, UpdateTaskInput>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const task = await taskService.update(userId, req.params.id, req.body);
            sendSuccess(res, task, 'Task updated successfully');
        } catch (error) {
            next(error);
        }
    }

    // Delete task
    async delete(
        req: Request<{ id: string }>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            await taskService.delete(userId, req.params.id);
            sendSuccess(res, null, 'Task deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    // Complete task
    async complete(
        req: Request<{ id: string }, unknown, CompleteTaskInput>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const task = await taskService.complete(userId, req.params.id, req.body);
            sendSuccess(res, task, 'Task completed! Great work.');
        } catch (error) {
            next(error);
        }
    }

    // Carry task to new date
    async carry(
        req: Request<{ id: string }, unknown, CarryTaskInput>,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const result = await taskService.carry(userId, req.params.id, req.body);

            const isMultiple = Array.isArray(result);
            const message = isMultiple
                ? `Task split into ${result.length} smaller chunks. Complete them to build momentum.`
                : 'Task carried. Remember: patterns of carrying are tracked.';

            sendSuccess(res, result, message);
        } catch (error) {
            next(error);
        }
    }

    // Get today's summary
    async getTodaySummary(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.userId!.toString();
            const summary = await taskService.getTodaySummary(userId);
            sendSuccess(res, summary);
        } catch (error) {
            next(error);
        }
    }
}

export const taskController = new TaskController();
