import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../lib/http';
import { mlServiceClient } from '../../altasai/clients/mlServiceClient';
import { logger } from '../../utils/logger';
import { recordBusinessEvent } from '../../services/metrics';
import { z } from 'zod';

export const rewardsRouter = Router();

const rewardSchema = z.object({
  action: z.string().min(1).max(100),
  reward: z.number().min(-1).max(1),
});

const requireUser = (req: { user?: { uid: string } }) => {
  if (!req.user?.uid) throw new Error('Missing authenticated user');
  return req.user.uid;
};

rewardsRouter.use(requireAuth);

rewardsRouter.post('/', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const body = rewardSchema.parse(req.body);
  
  const result = await mlServiceClient.recordReward(userId, body.action, body.reward);
  
  if (!result.ok) {
    res.json({ success: false, reason: result.fallbackReason });
    return;
  }
  
  res.json({ success: true });
  recordBusinessEvent('reward_recorded', { action: body.action, reward: body.reward });
}));

export const subscriptionRouter = Router();

const checkoutSchema = z.object({
  tier: z.enum(['pro', 'team']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

const portalSchema = z.object({
  customerId: z.string().min(1),
  returnUrl: z.string().url(),
});

subscriptionRouter.use(requireAuth);

subscriptionRouter.get('/', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const { getTierLimits } = await import('../../services/subscription');
  const { getStripeConfigStatus, STRIPE_AVAILABLE } = await import('../../services/stripe');
  
  const limits = await getTierLimits(userId);
  res.json({ ...limits, payments: getStripeConfigStatus() });
}));

subscriptionRouter.post('/checkout', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const { STRIPE_AVAILABLE, createCheckoutSession } = await import('../../services/stripe');
  
  if (!STRIPE_AVAILABLE) {
    const { getStripeConfigStatus } = await import('../../services/stripe');
    res.status(503).json({ error: { code: 'payments_unavailable', message: getStripeConfigStatus().message } });
    return;
  }
  
  const body = checkoutSchema.parse(req.body);
  const email = (req as { user?: { uid: string; email?: string } }).user?.email ?? '';
  
  const result = await createCheckoutSession(userId, email, body.tier, body.successUrl, body.cancelUrl);
  
  if (!result.url) {
    res.status(503).json({ error: { code: 'checkout_failed', message: result.error } });
    return;
  }
  
  res.json({ url: result.url });
  recordBusinessEvent('subscription_checkout_created', { tier: body.tier });
}));

subscriptionRouter.post('/portal', asyncHandler(async (req, res) => {
  const { STRIPE_AVAILABLE, createPortalSession } = await import('../../services/stripe');
  
  if (!STRIPE_AVAILABLE) {
    const { getStripeConfigStatus } = await import('../../services/stripe');
    res.status(503).json({ error: { code: 'payments_unavailable', message: getStripeConfigStatus().message } });
    return;
  }
  
  const body = portalSchema.parse(req.body);
  const result = await createPortalSession(body.customerId, body.returnUrl);
  
  if (!result.url) {
    res.status(503).json({ error: { code: 'portal_failed', message: result.error } });
    return;
  }
  
  res.json({ url: result.url });
  recordBusinessEvent('subscription_portal_created');
}));