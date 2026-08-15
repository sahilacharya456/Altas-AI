import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../lib/http';
import { env } from '../../config/env';
import { enforceUserQuota } from '../../services/quota';
import { runMentorOrchestration, runAltasAIOrchestrator } from '../../altasai';
import { retrieveSafeMemory } from '../../services/memory';
import { retrieveConversationHistory } from '../../services/conversation';
import { getTierLimits } from '../../services/subscription';
import { sanitizePrompt } from '../../services/security';
import { isProjectScopedInput, OUT_OF_CONTEXT_RESPONSE } from '../../services/projectScope';
import { logger } from '../../utils/logger';
import { recordBusinessEvent } from '../../services/metrics';
import { db, FieldValue } from '../../lib/firebaseAdmin';
import type { DocumentReference } from 'firebase-admin/firestore';
import { z } from 'zod';

export const mentorRouter = Router();

const clientContextSchema = z.object({
  pendingTasks: z.number().int().min(0).default(0),
  completedTasks: z.number().int().min(0).default(0),
  completionRate: z.number().min(0).max(100).default(0),
  activeGoalCount: z.number().int().min(0).default(0),
  topGoalTitle: z.string().max(200).optional(),
  topGoalProgress: z.number().min(0).max(100).optional(),
  disciplineLevel: z.enum(['mentor', 'strict', 'ruthless']).optional(),
  focusAreas: z.array(z.string()).max(10).optional(),
  currentScores: z.object({
    discipline: z.number().min(0).max(100),
    productivity: z.number().min(0).max(100),
    consistency: z.number().min(0).max(100),
  }).optional(),
  lifeRhythm: z.object({
    wakeTime: z.string().max(20).optional(),
    sleepTime: z.string().max(20).optional(),
    timezone: z.string().max(60).optional(),
  }).optional(),
}).optional();

const mentorSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  conversationId: z.string().trim().max(200).optional(),
  contextType: z.enum(['general', 'morning', 'task_review', 'reflection']).optional(),
  clientContext: clientContextSchema,
});

const requireUser = (req: { user?: { uid: string } }) => {
  if (!req.user?.uid) throw new Error('Missing authenticated user');
  return req.user.uid;
};

mentorRouter.use(requireAuth);

mentorRouter.post('/', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const body = mentorSchema.parse(req.body);
  body.message = sanitizePrompt(body.message);
  
  if (!isProjectScopedInput(body.message)) {
    res.json({
      response: OUT_OF_CONTEXT_RESPONSE,
      conversationId: body.conversationId || `local_${Date.now()}`,
      offline: true,
      provider: 'internal',
      intent: { label: 'out_of_context', confidence: 1, rationale: OUT_OF_CONTEXT_RESPONSE },
      recommendations: [],
    });
    return;
  }
  
  const limits = await getTierLimits(userId);
  await enforceUserQuota(userId, { bucket: 'mentor', limit: limits.dailyMentorMessages });

  const [memory, conversationHistory] = await Promise.all([
    retrieveSafeMemory(userId),
    body.conversationId && limits.conversationHistoryEnabled
      ? retrieveConversationHistory(userId, body.conversationId)
      : Promise.resolve([]),
  ]);

  const stats = await (await import('../../services/tasks')).getDailyTaskStats(userId);
  const safeClientContext = body.clientContext ? {
    ...body.clientContext,
    pendingTasks: stats.pendingTasks,
    completedTasks: stats.completedTasks,
    completionRate: stats.completionRate,
    activeGoalCount: Math.min(Math.max(0, body.clientContext.activeGoalCount ?? 0), 100),
    topGoalProgress: body.clientContext.topGoalProgress !== undefined ? Math.min(Math.max(0, body.clientContext.topGoalProgress), 100) : undefined,
    currentScores: body.clientContext.currentScores ? {
      discipline: Math.min(Math.max(0, body.clientContext.currentScores.discipline), 100),
      productivity: Math.min(Math.max(0, body.clientContext.currentScores.productivity), 100),
      consistency: Math.min(Math.max(0, body.clientContext.currentScores.consistency), 100),
    } : undefined,
  } : undefined;

  const result = await runMentorOrchestration({
    userId,
    message: body.message,
    memory,
    contextType: body.contextType,
    conversationHistory,
    clientContext: safeClientContext,
  }, { enhanceWithGemini: true, useML: true });

  recordBusinessEvent('mentor_message_sent');
  if (result.offline) recordBusinessEvent('mentor_fallback_used');
  recordBusinessEvent(`subscription_check_${limits.tier}`);

  let conversationId = body.conversationId || `local_${Date.now()}`;
  try {
    let conversationRef: DocumentReference;
    if (body.conversationId && !body.conversationId.startsWith('offline-')) {
      conversationRef = db.doc(`users/${userId}/conversations/${body.conversationId}`);
    } else {
      conversationRef = db.collection(`users/${userId}/conversations`).doc();
      await conversationRef.set({
        contextType: body.contextType ?? 'general',
        messages: [],
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        lastMessageAt: FieldValue.serverTimestamp(),
      });
    }

    await conversationRef.set({
      messages: FieldValue.arrayUnion(
        { role: 'user', content: body.message, timestamp: new Date() },
        { role: 'assistant', content: result.response, timestamp: new Date(), offline: result.offline, provider: result.provider }
      ),
      lastMessageAt: FieldValue.serverTimestamp(),
      lastIntent: result.plan.intent.label,
      lastRecommendations: result.plan.recommendations.map((r) => r.id),
    }, { merge: true });

    conversationId = conversationRef.id;

    await db.collection(`users/${userId}/aiFeedback`).add({
      type: body.contextType ?? 'general',
      prompt: body.message.slice(0, 500),
      response: result.response,
      provider: result.provider,
      offline: result.offline,
      internalPlan: {
        intent: result.plan.intent,
        patterns: result.plan.patterns,
        recommendations: result.plan.recommendations,
        agentActions: result.actions.map((action) => ({
          id: action.id,
          type: action.type,
          status: action.status,
          title: action.title,
          risk: action.risk,
          result: action.result,
        })),
      },
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (storeError) {
    logger.warn('mentor.store_failed', { userId, error: storeError instanceof Error ? storeError.message : String(storeError) });
  }

  res.json({
    response: result.response,
    conversationId,
    offline: result.offline,
    provider: result.provider,
    intent: result.plan.intent,
    recommendations: result.plan.recommendations,
    nextActions: result.nextActions,
    actions: result.actions,
    security: result.security,
    tier: limits.tier,
  });
}));