import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../lib/http';
import { env } from '../../config/env';
import { enforceUserQuota } from '../../services/quota';
import { runAltasAIOrchestrator, runMentorOrchestration } from '../../altasai';
import { retrieveSafeMemory } from '../../services/memory';
import { generateGeminiText, parseJsonWithSchema } from '../../services/gemini';
import { interventionPrompt, systemBase } from '../../services/prompts';
import { sanitizePrompt } from '../../services/security';
import { isProjectScopedInput, OUT_OF_CONTEXT_RESPONSE } from '../../services/projectScope';
import { logger } from '../../utils/logger';
import { recordBusinessEvent } from '../../services/metrics';
import { z } from 'zod';

export const interventionsRouter = Router();

const interventionOutputSchema = z.object({
  interventions: z.array(z.object({
    title: z.string(),
    message: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    action: z.string(),
  })).default([]),
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

interventionsRouter.use(requireAuth);

interventionsRouter.post('/', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const input = sanitizePrompt(typeof req.body?.input === 'string' ? req.body.input.slice(0, 1000) : undefined);
  
  if (!isProjectScopedInput(input)) {
    res.json({ output: [{ title: OUT_OF_CONTEXT_RESPONSE, message: OUT_OF_CONTEXT_RESPONSE, priority: 'low', action: OUT_OF_CONTEXT_RESPONSE }], offline: true });
    return;
  }
  
  await enforceUserQuota(userId, { bucket: 'interventions', limit: env.aiDailyQuota });
  const memory = await retrieveSafeMemory(userId);
  const orchestration = runAltasAIOrchestrator({ userId, message: input ?? 'what should I do next?', memory });
  const internalPlan = await runMentorOrchestration({ userId, message: input ?? 'what should I do next?', memory }, { enhanceWithGemini: false });
  
  const fallback = {
    interventions: internalPlan.plan.recommendations.map((recommendation) => ({
      title: recommendation.title,
      message: recommendation.reason,
      priority: recommendation.priority,
      action: recommendation.action,
    })),
  };
  
  const model = await withTimeout(generateGeminiText({
    systemInstruction: systemBase,
    prompt: interventionPrompt(input, memory),
  }), 15000);
  
  const parsed = model.offline ? fallback : parseJsonWithSchema(model.text, interventionOutputSchema, fallback);
  res.json({ output: parsed.interventions ?? fallback.interventions, offline: model.offline, orchestration });
  
  recordBusinessEvent('interventions_generated');
}));