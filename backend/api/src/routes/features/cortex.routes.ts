import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../lib/http';
import { env } from '../../config/env';
import { enforceUserQuota } from '../../services/quota';
import { runAltasAIOrchestrator } from '../../altasai';
import { retrieveSafeMemory } from '../../services/memory';
import { logger } from '../../utils/logger';
import { recordBusinessEvent } from '../../services/metrics';
import { sanitizePrompt } from '../../services/security';
import { isProjectScopedInput, OUT_OF_CONTEXT_RESPONSE } from '../../services/projectScope';

export const cortexRouter = Router();

const requireUser = (req: { user?: { uid: string } }) => {
  if (!req.user?.uid) throw new Error('Missing authenticated user');
  return req.user.uid;
};

cortexRouter.use(requireAuth);

cortexRouter.post('/', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const input = typeof req.body?.input === 'string' ? req.body.input.slice(0, 1000) : 'cortex insight';
  
  if (!isProjectScopedInput(input)) {
    res.json({
      output: {
        topInsight: OUT_OF_CONTEXT_RESPONSE,
        topRisk: OUT_OF_CONTEXT_RESPONSE,
        bestNextAction: OUT_OF_CONTEXT_RESPONSE,
        confidence: 1,
      },
      offline: true,
      provider: 'internal',
    });
    return;
  }
  
  await enforceUserQuota(userId, { bucket: 'cortex', limit: env.aiDailyQuota });
  const memory = await retrieveSafeMemory(userId);
  const orchestration = runAltasAIOrchestrator({ userId, message: input, memory });
  
  res.json({
    output: orchestration.cortexInsight,
    userStateVector: orchestration.userStateVector,
    models: {
      productivityState: orchestration.productivityState,
      deadlineRisk: orchestration.deadlineRisk,
      focusPrediction: orchestration.focusPrediction,
      burnoutRisk: orchestration.burnoutRisk,
      goalProgress: orchestration.goalProgress,
      habitConsistency: orchestration.habitConsistency,
      financePattern: orchestration.financePattern,
      healthHabitPattern: orchestration.healthHabitPattern,
      securityAwareness: orchestration.securityAwareness,
      anomalies: orchestration.anomalies,
    },
    offline: true,
    provider: 'internal',
  });
  
  recordBusinessEvent('cortex_insight_generated');
}));