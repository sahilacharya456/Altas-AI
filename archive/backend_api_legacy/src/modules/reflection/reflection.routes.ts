import { Router } from 'express';
import { reflectionController } from './reflection.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import { submitReflectionSchema } from './reflection.validators.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Submit reflection
router.post(
    '/',
    validateBody(submitReflectionSchema),
    reflectionController.submit.bind(reflectionController)
);

// Get streak
router.get(
    '/streak',
    reflectionController.getStreak.bind(reflectionController)
);

// Get history
router.get(
    '/history',
    reflectionController.getHistory.bind(reflectionController)
);

// Get by date
router.get(
    '/:date',
    reflectionController.getByDate.bind(reflectionController)
);

export default router;
