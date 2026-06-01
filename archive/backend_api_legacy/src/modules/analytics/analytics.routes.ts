import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get analytics summary (dashboard)
router.get(
    '/summary',
    analyticsController.getSummary.bind(analyticsController)
);

// Get daily breakdown for charts
router.get(
    '/daily',
    analyticsController.getDailyBreakdown.bind(analyticsController)
);

export default router;
