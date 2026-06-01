import { Router } from 'express';
import { z } from 'zod';

import { ApiError, asyncHandler } from '../lib/http';
import { db, FieldValue } from '../lib/firebaseAdmin';
import { mlServiceClient } from '../altasai/clients/mlServiceClient';

export const recommendationsRouter = Router();

const requireUser = (req: { user?: { uid: string } }) => {
  if (!req.user?.uid) throw new ApiError(401, 'Missing authenticated user.', 'unauthenticated');
  return req.user.uid;
};

const recommendationFeedbackSchema = z.object({
  recommendationId: z.string().trim().min(1).max(160),
  source: z.enum(['mentor', 'cortex', 'intervention', 'report', 'daily_plan']).default('intervention'),
  action: z.enum(['shown', 'accepted', 'dismissed', 'completed', 'not_helpful', 'helpful']),
  recommendationType: z.string().trim().min(1).max(120).optional(),
  variant: z.enum(['A', 'B']).optional(),
  outcome: z.enum(['unknown', 'success', 'failed', 'skipped']).default('unknown'),
  rating: z.number().int().min(1).max(5).optional(),
  context: z.record(z.unknown()).optional(),
});

const rewardForFeedback = (
  action: z.infer<typeof recommendationFeedbackSchema>['action'],
  rating?: number
) => {
  if (typeof rating === 'number') return Math.max(-1, Math.min(1, (rating - 3) / 2));
  if (action === 'completed' || action === 'helpful') return 1;
  if (action === 'accepted') return 0.6;
  if (action === 'shown') return 0.1;
  if (action === 'dismissed') return -0.25;
  return -0.75;
};

const getRecommendationVariant = (userId: string, recommendationId: string): 'A' | 'B' => {
  const seed = `${userId}:${recommendationId}`.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return seed % 2 === 0 ? 'A' : 'B';
};

recommendationsRouter.post('/feedback', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const body = recommendationFeedbackSchema.parse(req.body);
  const variant = body.variant ?? getRecommendationVariant(userId, body.recommendationId);
  const reward = rewardForFeedback(body.action, body.rating);

  await db.collection(`users/${userId}/recommendationFeedback`).add({
    recommendationId: body.recommendationId,
    source: body.source,
    action: body.action,
    recommendationType: body.recommendationType ?? null,
    variant,
    outcome: body.outcome,
    rating: body.rating ?? null,
    reward,
    context: body.context ?? {},
    createdAt: FieldValue.serverTimestamp(),
  });

  await db.doc(`users/${userId}/recommendationStats/${body.recommendationId}`).set({
    recommendationId: body.recommendationId,
    source: body.source,
    recommendationType: body.recommendationType ?? null,
    variant,
    shownCount: FieldValue.increment(body.action === 'shown' ? 1 : 0),
    acceptedCount: FieldValue.increment(body.action === 'accepted' ? 1 : 0),
    completedCount: FieldValue.increment(body.action === 'completed' ? 1 : 0),
    dismissedCount: FieldValue.increment(body.action === 'dismissed' ? 1 : 0),
    helpfulCount: FieldValue.increment(body.action === 'helpful' ? 1 : 0),
    notHelpfulCount: FieldValue.increment(body.action === 'not_helpful' ? 1 : 0),
    rewardTotal: FieldValue.increment(reward),
    feedbackCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  const mlReward = await mlServiceClient.recordReward(userId, body.recommendationId, reward);

  res.status(201).json({
    ok: true,
    recommendationId: body.recommendationId,
    variant,
    reward,
    stored: true,
    mlRewardSynced: mlReward.ok,
  });
}));

recommendationsRouter.get('/stats/:userId', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  if (req.params.userId !== userId) {
    throw new ApiError(403, 'Recommendation stats can only be read by the owning user.', 'forbidden');
  }

  const limit = Math.min(Number(req.query.limit ?? 25) || 25, 100);
  const snapshot = await db.collection(`users/${userId}/recommendationStats`).limit(limit).get();
  const stats = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const totals = stats.reduce((acc, item: Record<string, unknown>) => {
    const feedbackCount = Number(item.feedbackCount ?? 0);
    const completedCount = Number(item.completedCount ?? 0);
    const acceptedCount = Number(item.acceptedCount ?? 0);
    const rewardTotal = Number(item.rewardTotal ?? 0);
    return {
      feedbackCount: acc.feedbackCount + feedbackCount,
      acceptedCount: acc.acceptedCount + acceptedCount,
      completedCount: acc.completedCount + completedCount,
      rewardTotal: acc.rewardTotal + rewardTotal,
    };
  }, { feedbackCount: 0, acceptedCount: 0, completedCount: 0, rewardTotal: 0 });

  res.json({
    ok: true,
    userId,
    totals: {
      ...totals,
      averageReward: totals.feedbackCount > 0 ? totals.rewardTotal / totals.feedbackCount : 0,
    },
    stats,
  });
}));

recommendationsRouter.get('/export/:userId', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  if (req.params.userId !== userId) {
    throw new ApiError(403, 'Recommendation training exports can only be read by the owning user.', 'forbidden');
  }

  const limit = Math.min(Number(req.query.limit ?? 500) || 500, 1000);
  const snapshot = await db.collection(`users/${userId}/recommendationFeedback`).limit(limit).get();
  const rows = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId,
      recommendationId: data.recommendationId,
      source: data.source,
      action: data.action,
      variant: data.variant,
      outcome: data.outcome,
      rating: data.rating,
      reward: data.reward,
      context: data.context ?? {},
    };
  });

  res.json({
    ok: true,
    userId,
    format: 'altasai_recommendation_feedback_v1',
    count: rows.length,
    rows,
  });
}));
