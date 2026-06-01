import { Types } from 'mongoose';
import { Task, ITask, TaskStatus } from './task.model.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../shared/errors/AppError.js';
import {
    CreateTaskInput,
    UpdateTaskInput,
    CompleteTaskInput,
    CarryTaskInput,
    ListTasksInput,
} from './task.validators.js';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export class TaskService {
    // Create a new task
    async create(userId: string, data: CreateTaskInput): Promise<ITask> {
        const task = await Task.create({
            userId: new Types.ObjectId(userId),
            ...data,
            scheduledDate: new Date(data.scheduledDate),
            goalId: data.goalId ? new Types.ObjectId(data.goalId) : undefined,
        });

        return task;
    }

    // Get task by ID with ownership check
    async getById(userId: string, taskId: string): Promise<ITask> {
        const task = await Task.findById(taskId);

        if (!task) {
            throw NotFoundError('Task not found');
        }

        if (task.userId.toString() !== userId) {
            throw ForbiddenError('You do not have access to this task');
        }

        return task;
    }

    // List tasks with filtering and pagination
    async list(userId: string, filters: ListTasksInput): Promise<{
        tasks: ITask[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const query: Record<string, unknown> = { userId: new Types.ObjectId(userId) };

        // Date filtering
        if (filters.date) {
            const date = parseISO(filters.date);
            query.scheduledDate = {
                $gte: startOfDay(date),
                $lte: endOfDay(date),
            };
        } else if (filters.startDate && filters.endDate) {
            query.scheduledDate = {
                $gte: startOfDay(parseISO(filters.startDate)),
                $lte: endOfDay(parseISO(filters.endDate)),
            };
        }

        // Status filter
        if (filters.status) {
            query.status = filters.status;
        }

        // Category filter
        if (filters.category) {
            query.category = filters.category;
        }

        // Priority filter
        if (filters.priority) {
            query.priority = filters.priority;
        }

        // Goal filter
        if (filters.goalId) {
            query.goalId = new Types.ObjectId(filters.goalId);
        }

        const page = filters.page || 1;
        const limit = Math.min(filters.limit || 50, 100);
        const skip = (page - 1) * limit;

        const [tasks, total] = await Promise.all([
            Task.find(query)
                .sort({ scheduledDate: 1, priority: -1, createdAt: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Task.countDocuments(query),
        ]);

        return {
            tasks: tasks as unknown as ITask[],
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    }

    // Update task
    async update(userId: string, taskId: string, data: UpdateTaskInput): Promise<ITask> {
        const task = await this.getById(userId, taskId);

        // Don't allow editing completed tasks
        if (task.status === 'completed') {
            throw BadRequestError('Cannot edit a completed task');
        }

        // Filter out null values and values that need type conversion
        const { description, scheduledDate, ...restData } = data;
        const updateData: Partial<ITask> = { ...restData } as Partial<ITask>;

        // Handle description separately (null means delete)
        if (description !== undefined) {
            updateData.description = description === null ? undefined : description;
        }

        if (scheduledDate) {
            updateData.scheduledDate = new Date(scheduledDate);
        }

        Object.assign(task, updateData);
        await task.save();

        return task;
    }

    // Delete task
    async delete(userId: string, taskId: string): Promise<void> {
        const task = await this.getById(userId, taskId);
        await task.deleteOne();
    }

    // Mark task as complete
    async complete(userId: string, taskId: string, data: CompleteTaskInput): Promise<ITask> {
        const task = await this.getById(userId, taskId);

        if (task.status === 'completed') {
            throw BadRequestError('Task is already completed');
        }

        task.status = 'completed';
        task.completedAt = new Date();

        if (data.actualMinutes !== undefined) {
            task.actualMinutes = data.actualMinutes;
        }

        await task.save();

        return task;
    }

    // Carry task to a new date (ATLAS's non-destructive carry system)
    async carry(userId: string, taskId: string, data: CarryTaskInput): Promise<ITask | ITask[]> {
        const task = await this.getById(userId, taskId);

        if (task.status === 'completed') {
            throw BadRequestError('Cannot carry a completed task');
        }

        if (task.carryCount >= 3) {
            throw BadRequestError(
                'Task has been carried 3 times. You must complete it or mark it as cancelled.'
            );
        }

        const newDate = new Date(data.newDate);

        // Check if we should split the task into smaller chunks
        if (data.splitIntoChunks && task.estimatedMinutes > 60) {
            // Mark original as carried
            task.status = 'carried';
            await task.save();

            // Split into 2-3 smaller chunks
            const chunkCount = task.estimatedMinutes > 120 ? 3 : 2;
            const chunkMinutes = Math.ceil(task.estimatedMinutes / chunkCount);

            const chunks: ITask[] = [];

            for (let i = 0; i < chunkCount; i++) {
                const chunk = await Task.create({
                    userId: task.userId,
                    title: `${task.title} (Part ${i + 1}/${chunkCount})`,
                    description: task.description,
                    category: task.category,
                    priority: task.priority,
                    scheduledDate: newDate,
                    estimatedMinutes: i === chunkCount - 1
                        ? task.estimatedMinutes - (chunkMinutes * (chunkCount - 1))
                        : chunkMinutes,
                    tags: task.tags,
                    goalId: task.goalId,
                    isCarried: true,
                    carryCount: task.carryCount + 1,
                    originalDate: task.originalDate,
                    carriedFrom: task._id,
                });
                chunks.push(chunk);
            }

            return chunks;
        }

        // Simple carry without splitting
        task.scheduledDate = newDate;
        task.isCarried = true;
        task.carryCount += 1;
        task.status = 'pending';

        await task.save();

        return task;
    }

    // Get today's tasks summary
    async getTodaySummary(userId: string): Promise<{
        total: number;
        completed: number;
        pending: number;
        inProgress: number;
        carried: number;
        completionRate: number;
    }> {
        const today = new Date();
        const query = {
            userId: new Types.ObjectId(userId),
            scheduledDate: {
                $gte: startOfDay(today),
                $lte: endOfDay(today),
            },
        };

        const tasks = await Task.find(query).select('status').lean();

        const summary = {
            total: tasks.length,
            completed: 0,
            pending: 0,
            inProgress: 0,
            carried: 0,
            completionRate: 0,
        };

        tasks.forEach((task) => {
            switch (task.status) {
                case 'completed':
                    summary.completed++;
                    break;
                case 'pending':
                    summary.pending++;
                    break;
                case 'in_progress':
                    summary.inProgress++;
                    break;
                case 'carried':
                    summary.carried++;
                    break;
            }
        });

        summary.completionRate = summary.total > 0
            ? Math.round((summary.completed / summary.total) * 100)
            : 0;

        return summary;
    }
}

export const taskService = new TaskService();
