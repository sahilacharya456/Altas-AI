import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../lib/http';
import { env } from '../../config/env';
import { enforceUserQuota } from '../../services/quota';
import { generateGeminiText, parseJsonWithSchema } from '../../services/gemini';
import { budgetPrompt, securityPrompt, systemBase } from '../../services/prompts';
import { runAltasAIOrchestrator } from '../../altasai';
import { retrieveSafeMemory } from '../../services/memory';
import { sanitizePrompt } from '../../services/security';
import { isProjectScopedInput, OUT_OF_CONTEXT_RESPONSE } from '../../services/projectScope';
import { logger } from '../../utils/logger';
import { recordBusinessEvent } from '../../services/metrics';
import { z } from 'zod';

export const budgetRouter = Router();

const budgetOutputSchema = z.object({
  insights: z.array(z.object({
    type: z.enum(['warning', 'critical', 'success']),
    message: z.string(),
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

budgetRouter.use(requireAuth);

budgetRouter.post('/discipline', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  await enforceUserQuota(userId, { bucket: 'budget-discipline', limit: env.aiDailyQuota });
  const memory = await retrieveSafeMemory(userId);
  
  const fallback = {
    insights: [{ type: 'warning' as const, message: 'Keep spending decisions deliberate until AltasAI has enough budget data.', action: 'Review today expenses before adding new discretionary spending.' }],
  };
  
  const model = await withTimeout(generateGeminiText({
    systemInstruction: systemBase,
    prompt: budgetPrompt(memory),
    maxOutputTokens: 600,
  }), 15000);
  
  const parsed = model.offline ? fallback : parseJsonWithSchema(model.text, budgetOutputSchema, fallback);
  res.json({ success: true, insights: parsed.insights ?? fallback.insights, offline: model.offline });
  recordBusinessEvent('budget_discipline_generated');
}));

export const securityRouter = Router();

const securityOutputSchema = z.object({
  title: z.string(),
  message: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  action: z.string(),
});

const securityAdviceSchema = z.object({
  input: z.string().min(1).max(2000),
});

securityRouter.use(requireAuth);

securityRouter.post('/advice', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const body = securityAdviceSchema.parse(req.body);
  const input = sanitizePrompt(body.input);
  
  if (!isProjectScopedInput(input)) {
    res.json({
      output: {
        title: OUT_OF_CONTEXT_RESPONSE,
        message: OUT_OF_CONTEXT_RESPONSE,
        priority: 'low',
        action: OUT_OF_CONTEXT_RESPONSE,
      },
      offline: true,
    });
    return;
  }
  
  await enforceUserQuota(userId, { bucket: 'security-advice', limit: env.aiDailyQuota });
  const memory = await retrieveSafeMemory(userId);
  const orchestration = runAltasAIOrchestrator({ userId, message: input, memory });
  
  const fallback = {
    title: orchestration.securityAwareness.label === 'offensive_blocked' ? 'Offensive request blocked' : 'Use defensive verification',
    message: orchestration.securityAwareness.recommendation,
    priority: orchestration.securityAwareness.label === 'offensive_blocked' ? 'critical' as const : 'medium' as const,
    action: orchestration.securityAwareness.nextAction,
  };
  
  const model = await withTimeout(generateGeminiText({
    systemInstruction: systemBase,
    prompt: securityPrompt(input),
  }), 15000);
  
  res.json({ output: model.offline ? fallback : parseJsonWithSchema(model.text, securityOutputSchema, fallback), offline: model.offline, orchestration });
  recordBusinessEvent('security_advice_generated');
}));