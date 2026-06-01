import { Router } from 'express';
import { mentorController } from './mentor.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import { chatSchema } from './mentor.validators.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Chat with mentor
router.post(
    '/chat',
    validateBody(chatSchema),
    mentorController.chat.bind(mentorController)
);

// List conversations
router.get(
    '/conversations',
    mentorController.listConversations.bind(mentorController)
);

// Get single conversation
router.get(
    '/conversations/:id',
    mentorController.getConversation.bind(mentorController)
);

// Delete conversation
router.delete(
    '/conversations/:id',
    mentorController.deleteConversation.bind(mentorController)
);

export default router;
