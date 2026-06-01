import { Router } from 'express';
import { taskController } from './task.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../../middleware/validation.middleware.js';
import {
    createTaskSchema,
    updateTaskSchema,
    completeTaskSchema,
    carryTaskSchema,
    listTasksSchema,
} from './task.validators.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get today's summary (before /:id to avoid conflict)
router.get(
    '/summary/today',
    taskController.getTodaySummary.bind(taskController)
);

// List tasks
router.get(
    '/',
    validateQuery(listTasksSchema),
    taskController.list.bind(taskController)
);

// Create task
router.post(
    '/',
    validateBody(createTaskSchema),
    taskController.create.bind(taskController)
);

// Get task by ID
router.get(
    '/:id',
    taskController.getById.bind(taskController)
);

// Update task
router.patch(
    '/:id',
    validateBody(updateTaskSchema),
    taskController.update.bind(taskController)
);

// Delete task
router.delete(
    '/:id',
    taskController.delete.bind(taskController)
);

// Complete task
router.post(
    '/:id/complete',
    validateBody(completeTaskSchema),
    taskController.complete.bind(taskController)
);

// Carry task to new date
router.post(
    '/:id/carry',
    validateBody(carryTaskSchema),
    taskController.carry.bind(taskController)
);

export default router;
