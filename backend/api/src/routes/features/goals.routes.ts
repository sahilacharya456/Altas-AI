import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../lib/http';
import { env } from '../../config/env';
import { enforceUserQuota } from '../../services/quota';
import { generateGeminiText, parseJsonWithSchema } from '../../services/gemini';
import { goalBreakdownPrompt, systemBase } from '../../services/prompts';
import { sanitizePrompt } from '../../services/security';
import { isProjectScopedInput, OUT_OF_CONTEXT_RESPONSE } from '../../services/projectScope';
import { db, FieldValue } from '../../lib/firebaseAdmin';
import { logger } from '../../utils/logger';
import { recordBusinessEvent } from '../../services/metrics';
import { z } from 'zod';

export const goalsRouter = Router();

const goalBreakdownOutputSchema = z.object({
  milestones: z.array(z.string()).min(1).max(8),
});

const goalSchema = z.object({
  goalId: z.string().min(1).max(200),
  goalTitle: z.string().min(1).max(500),
  goalDescription: z.string().max(2000).optional(),
});

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Operation timed out')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

const requireUser = (req: { user?: { uid: string } }) => {
  if (!req.user?.uid) throw new Error('Missing authenticated user');
  return req.user.uid;
};

goalsRouter.use(requireAuth);

goalsRouter.post('/breakdown', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const body = goalSchema.parse(req.body);
  
  if (!isProjectScopedInput(`${body.goalTitle} ${body.goalDescription ?? ''}`)) {
    res.json({ milestones: [OUT_OF_CONTEXT_RESPONSE], offline: true });
    return;
  }
  
  await enforceUserQuota(userId, { bucket: 'goal-breakdown', limit: env.aiDailyQuota });
  
  const fallback = { milestones: ['Define the first concrete step', 'Schedule a focused work block', 'Review progress and adjust'] };
  
  const model = await withTimeout(generateGeminiText({
    systemInstruction: systemBase,
    prompt: goalBreakdownPrompt(body.goalTitle, body.goalDescription),
    maxOutputTokens: 500,
  }), 15000);
  
  const parsed = model.offline ? fallback : parseJsonWithSchema(model.text, goalBreakdownOutputSchema, fallback);
  const milestones = Array.isArray(parsed.milestones) ? parsed.milestones.map(String).slice(0, 8) : fallback.milestones;
  
  await db.doc(`users/${userId}/goals/${body.goalId}`).set({ aiBreakdown: milestones, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  
  res.json({ milestones, offline: model.offline });
  recordBusinessEvent('goal_breakdown_generated');
}));