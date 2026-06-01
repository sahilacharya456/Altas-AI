import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validation.middleware.js';
import { authLimiter } from '../../middleware/rateLimiter.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  onboardingSchema,
} from './auth.validators.js';

const router = Router();

// Public routes (with rate limiting)
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  authController.register.bind(authController)
);

router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  authController.login.bind(authController)
);

router.post(
  '/refresh',
  authLimiter,
  validateBody(refreshTokenSchema),
  authController.refreshToken.bind(authController)
);

// Protected routes
router.post(
  '/onboarding',
  authenticate,
  validateBody(onboardingSchema),
  authController.completeOnboarding.bind(authController)
);

router.get(
  '/profile',
  authenticate,
  authController.getProfile.bind(authController)
);

router.patch(
  '/profile',
  authenticate,
  authController.updateProfile.bind(authController)
);

router.post(
  '/logout',
  authenticate,
  authController.logout.bind(authController)
);

export default router;
