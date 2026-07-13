import { Router } from 'express';
import type { DocumentReference } from 'firebase-admin/firestore';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { ApiError, asyncHandler } from '../lib/http';
import { db, FieldValue } from '../lib/firebaseAdmin';
import { generateGeminiText, parseJsonWithSchema } from '../services/gemini';
import { retrieveSafeMemory } from '../services/memory';
import { env } from '../config/env';
import { enforceUserQuota } from '../services/quota';
import { runAltasAIOrchestrator, runMentorOrchestration, runReportInsight } from '../altasai';
import { runSecureMentorAgent } from '../services/mentorAgent';
import { mlServiceClient } from '../altasai/clients/mlServiceClient';
import { retrieveConversationHistory } from '../services/conversation';
import { getTierLimits } from '../services/subscription';
import { createCheckoutSession, createPortalSession, getStripeConfigStatus, STRIPE_AVAILABLE } from '../services/stripe';
import { verifyGitHubProof, buildGitHubProofSummary } from '../services/githubProof';
import { recordBusinessEvent } from '../services/metrics';
import { logger } from '../utils/logger';
import { recommendationsRouter } from './recommendations.routes';
import { isProjectScopedInput, OUT_OF_CONTEXT_RESPONSE } from '../services/projectScope';
import {
  budgetPrompt,
  dailyBriefingPrompt,
  goalBreakdownPrompt,
  interventionPrompt,
  proofReviewPrompt,
  reflectionFeedbackPrompt,
  securityPrompt,
  systemBase,
  weeklyReportPrompt,
} from '../services/prompts';

export const aiRouter = Router();

aiRouter.use(requireAuth);

const requireUser = (req: { user?: { uid: string } }) => {
  if (!req.user?.uid) throw new ApiError(401, 'Missing authenticated user.', 'unauthenticated');
  return req.user.uid;
};

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

const dailyBriefingOutputSchema = z.object({
  topPriority: z.string(),
  executionRisk: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  reason: z.string(),
  suggestedAction: z.string(),
  avoidToday: z.array(z.string()).default([]),
});

const weeklyReportOutputSchema = z.object({
  summary: z.string(),
  wins: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  nextWeekActions: z.array(z.string()).default([]),
});

const goalBreakdownOutputSchema = z.object({
  milestones: z.array(z.string()).min(1).max(8),
});

const reflectionOutputSchema = z.object({
  feedback: z.string(),
  pattern: z.string(),
  tomorrowAction: z.string(),
});

const budgetOutputSchema = z.object({
  insights: z.array(z.object({
    type: z.enum(['warning', 'critical', 'success']),
    message: z.string(),
    action: z.string(),
  })).default([]),
});

const interventionOutputSchema = z.object({
  interventions: z.array(z.object({
    title: z.string(),
    message: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    action: z.string(),
  })).default([]),
});

const securityOutputSchema = z.object({
  title: z.string(),
  message: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  action: z.string(),
});

aiRouter.use('/recommendations', recommendationsRouter);

aiRouter.post('/mentor', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const body = mentorSchema.parse(req.body);
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

  // Fetch memory + conversation history in parallel (history gated to Pro)
  const [memory, conversationHistory] = await Promise.all([
    retrieveSafeMemory(userId),
    body.conversationId && limits.conversationHistoryEnabled
      ? retrieveConversationHistory(userId, body.conversationId)
      : Promise.resolve([]),
  ]);

  // Clamp client-supplied numeric scores to valid range. Never trust mobile for these.
  const rawCtx = body.clientContext;
  const safeClientContext = rawCtx ? {
    ...rawCtx,
    pendingTasks: Math.min(Math.max(0, rawCtx.pendingTasks ?? 0), 500),
    completedTasks: Math.min(Math.max(0, rawCtx.completedTasks ?? 0), 500),
    completionRate: Math.min(Math.max(0, rawCtx.completionRate ?? 0), 100),
    activeGoalCount: Math.min(Math.max(0, rawCtx.activeGoalCount ?? 0), 100),
    topGoalProgress: rawCtx.topGoalProgress !== undefined
      ? Math.min(Math.max(0, rawCtx.topGoalProgress), 100)
      : undefined,
    currentScores: rawCtx.currentScores ? {
      discipline: Math.min(Math.max(0, rawCtx.currentScores.discipline), 100),
      productivity: Math.min(Math.max(0, rawCtx.currentScores.productivity), 100),
      consistency: Math.min(Math.max(0, rawCtx.currentScores.consistency), 100),
    } : undefined,
  } : undefined;

  const result = await runSecureMentorAgent({
    userId,
    message: body.message,
    memory,
    contextType: body.contextType,
    conversationHistory,
    clientContext: safeClientContext,
  }, { enhanceWithGemini: true, automationMode: 'auto' });
  const response = result.response;

  recordBusinessEvent('mentor_message_sent');
  if (result.offline) recordBusinessEvent('mentor_fallback_used');
  recordBusinessEvent(`subscription_check_${limits.tier}` as Parameters<typeof recordBusinessEvent>[0]);

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
        { role: 'assistant', content: response, timestamp: new Date(), offline: result.offline, provider: result.provider }
      ),
      lastMessageAt: FieldValue.serverTimestamp(),
      lastIntent: result.plan.intent.label,
      lastRecommendations: result.plan.recommendations.map((recommendation) => recommendation.id),
    }, { merge: true });

    conversationId = conversationRef.id;

    await db.collection(`users/${userId}/aiFeedback`).add({
      type: body.contextType ?? 'general',
      prompt: body.message.slice(0, 500),
      response,
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
    response,
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

aiRouter.post('/daily-briefing', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const input = typeof req.body?.input === 'string' ? req.body.input.slice(0, 1000) : undefined;
  if (!isProjectScopedInput(input)) {
    res.json({
      output: {
        topPriority: OUT_OF_CONTEXT_RESPONSE,
        executionRisk: 0,
        riskLevel: 'low',
        reason: OUT_OF_CONTEXT_RESPONSE,
        suggestedAction: OUT_OF_CONTEXT_RESPONSE,
        avoidToday: [],
      },
      offline: true,
    });
    return;
  }
  await enforceUserQuota(userId, { bucket: 'daily-briefing', limit: env.aiDailyQuota });
  const memory = await retrieveSafeMemory(userId);
  const orchestration = runAltasAIOrchestrator({ userId, message: input ?? 'daily briefing', memory });
  const insight = runReportInsight(memory);
  const fallback = {
    topPriority: orchestration.rankedTasks[0]?.title ?? insight.bestNextAction,
    executionRisk: Math.max(orchestration.deadlineRisk.score, orchestration.burnoutRisk.score, 100 - insight.productivityScore),
    riskLevel: orchestration.deadlineRisk.label,
    reason: orchestration.cortexInsight.topRisk,
    suggestedAction: orchestration.cortexInsight.bestNextAction,
    avoidToday: ['Adding new work before completing one existing task', ...orchestration.anomalies.map((item) => item.recommendation).slice(0, 2)],
  };
  const model = await generateGeminiText({
    systemInstruction: systemBase,
    prompt: dailyBriefingPrompt(input, memory),
  });
  res.json({ output: model.offline ? fallback : parseJsonWithSchema(model.text, dailyBriefingOutputSchema, fallback), offline: model.offline, internalInsight: insight, orchestration });
}));

aiRouter.post('/weekly-report', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const input = typeof req.body?.input === 'string' ? req.body.input.slice(0, 1000) : undefined;
  if (!isProjectScopedInput(input)) {
    res.json({
      output: {
        summary: OUT_OF_CONTEXT_RESPONSE,
        wins: [],
        risks: [OUT_OF_CONTEXT_RESPONSE],
        nextWeekActions: [],
      },
      offline: true,
    });
    return;
  }
  await enforceUserQuota(userId, { bucket: 'weekly-report', limit: env.aiDailyQuota });
  const memory = await retrieveSafeMemory(userId);
  const orchestration = runAltasAIOrchestrator({ userId, message: input ?? 'weekly report', memory });
  const insight = runReportInsight(memory);
  const fallback = {
    summary: insight.summary,
    wins: insight.productivityScore >= 60 ? ['Execution momentum is visible in task completion.'] : ['Signals were captured for review.'],
    risks: [insight.biggestBlocker],
    nextWeekActions: [insight.bestNextAction, 'Complete reflections at the end of the day', 'Keep focus sessions measurable'],
  };
  const model = await generateGeminiText({
    systemInstruction: systemBase,
    prompt: weeklyReportPrompt(input, memory),
    maxOutputTokens: 850,
  });
  res.json({ output: model.offline ? fallback : parseJsonWithSchema(model.text, weeklyReportOutputSchema, fallback), offline: model.offline, internalInsight: insight, orchestration });
}));

const goalSchema = z.object({
  goalId: z.string().min(1).max(200),
  goalTitle: z.string().min(1).max(500),
  goalDescription: z.string().max(2000).optional(),
});

aiRouter.post('/goal-breakdown', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const body = goalSchema.parse(req.body);
  if (!isProjectScopedInput(`${body.goalTitle} ${body.goalDescription ?? ''}`)) {
    res.json({ milestones: [OUT_OF_CONTEXT_RESPONSE], offline: true });
    return;
  }
  await enforceUserQuota(userId, { bucket: 'goal-breakdown', limit: env.aiDailyQuota });
  const fallback = { milestones: ['Define the first concrete step', 'Schedule a focused work block', 'Review progress and adjust'] };
  const model = await generateGeminiText({
    systemInstruction: systemBase,
    prompt: goalBreakdownPrompt(body.goalTitle, body.goalDescription),
    maxOutputTokens: 500,
  });
  const parsed = model.offline ? fallback : parseJsonWithSchema(model.text, goalBreakdownOutputSchema, fallback);
  const milestones = Array.isArray(parsed.milestones) ? parsed.milestones.map(String).slice(0, 8) : fallback.milestones;
  await db.doc(`users/${userId}/goals/${body.goalId}`).set({ aiBreakdown: milestones, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  res.json({ milestones, offline: model.offline });
}));

const reflectionSchema = z.object({
  date: z.string().min(1).max(80),
});

const getDailyLogRefs = (userId: string, date: string): DocumentReference[] => {
  const ids = date.startsWith(`${userId}_`) ? [date] : [date, `${userId}_${date}`];
  return [...new Set(ids)].map((id) => db.doc(`users/${userId}/dailyLogs/${id}`));
};

aiRouter.post('/reflection-feedback', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  await enforceUserQuota(userId, { bucket: 'reflection-feedback', limit: env.aiDailyQuota });
  const body = reflectionSchema.parse(req.body);
  let ref: DocumentReference | null = null;
  let snap: Awaited<ReturnType<DocumentReference['get']>> | null = null;

  for (const candidate of getDailyLogRefs(userId, body.date)) {
    const candidateSnap = await candidate.get();
    if (candidateSnap.exists) {
      ref = candidate;
      snap = candidateSnap;
      break;
    }
  }

  if (!ref || !snap) throw new ApiError(404, 'Reflection not found.', 'not_found');
  const fallback = {
    feedback: 'Reflection captured. Pick one tomorrow priority and protect the first work block.',
    pattern: 'Execution improves when the next action is small.',
    tomorrowAction: 'Choose one priority before opening secondary tasks.',
  };
  const model = await generateGeminiText({
    systemInstruction: systemBase,
    prompt: reflectionFeedbackPrompt(snap.data() ?? {}),
    maxOutputTokens: 500,
  });
  const parsed = model.offline ? fallback : parseJsonWithSchema(model.text, reflectionOutputSchema, fallback);
  await ref.set({ mentorFeedback: parsed.feedback, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  res.json({ feedback: parsed.feedback, pattern: parsed.pattern, tomorrowAction: parsed.tomorrowAction, offline: model.offline });
}));

aiRouter.post('/budget-discipline', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  await enforceUserQuota(userId, { bucket: 'budget-discipline', limit: env.aiDailyQuota });
  const memory = await retrieveSafeMemory(userId);
  const fallback = {
    insights: [{ type: 'warning' as const, message: 'Keep spending decisions deliberate until AltasAI has enough budget data.', action: 'Review today expenses before adding new discretionary spending.' }],
  };
  const model = await generateGeminiText({
    systemInstruction: systemBase,
    prompt: budgetPrompt(memory),
    maxOutputTokens: 600,
  });
  const parsed = model.offline ? fallback : parseJsonWithSchema(model.text, budgetOutputSchema, fallback);
  res.json({ success: true, insights: parsed.insights ?? fallback.insights, offline: model.offline });
}));

aiRouter.post('/interventions', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const input = typeof req.body?.input === 'string' ? req.body.input.slice(0, 1000) : undefined;
  if (!isProjectScopedInput(input)) {
    res.json({ output: [{ title: OUT_OF_CONTEXT_RESPONSE, message: OUT_OF_CONTEXT_RESPONSE, priority: 'low', action: OUT_OF_CONTEXT_RESPONSE }], offline: true });
    return;
  }
  await enforceUserQuota(userId, { bucket: 'interventions', limit: env.aiDailyQuota });
  const memory = await retrieveSafeMemory(userId);
  const orchestration = runAltasAIOrchestrator({ userId, message: input ?? 'what should I do next?', memory });
  const internalPlan = runMentorOrchestration({ userId, message: input ?? 'what should I do next?', memory }, { enhanceWithGemini: false });
  const fallback = {
    interventions: (await internalPlan).plan.recommendations.map((recommendation) => ({
      title: recommendation.title,
      message: recommendation.reason,
      priority: recommendation.priority,
      action: recommendation.action,
    })),
  };
  const model = await generateGeminiText({
    systemInstruction: systemBase,
    prompt: interventionPrompt(input, memory),
  });
  const parsed = model.offline ? fallback : parseJsonWithSchema(model.text, interventionOutputSchema, fallback);
  res.json({ output: parsed.interventions ?? fallback.interventions, offline: model.offline, orchestration });
}));

aiRouter.post('/security-advice', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const input = z.object({ input: z.string().min(1).max(2000) }).parse(req.body).input;
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
  const model = await generateGeminiText({
    systemInstruction: systemBase,
    prompt: securityPrompt(input),
  });
  res.json({ output: model.offline ? fallback : parseJsonWithSchema(model.text, securityOutputSchema, fallback), offline: model.offline, orchestration });
}));

aiRouter.post('/cortex', asyncHandler(async (req, res) => {
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
}));

const proofReviewSchema = z.object({
  taskId: z.string().min(1).max(200),
  taskTitle: z.string().min(1).max(500),
  proofType: z.enum(['text', 'screenshot', 'github_link', 'file', 'study_notes', 'other']),
  proofContent: z.string().min(1).max(3000),
});

const proofReviewOutputSchema = z.object({
  status: z.enum(['verified', 'weak', 'rejected']),
  verdict: z.string(),
  feedbackToUser: z.string(),
  score: z.number().min(0).max(100),
});

aiRouter.post('/proof-review', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const body = proofReviewSchema.parse(req.body);
  const limits = await getTierLimits(userId);

  await enforceUserQuota(userId, { bucket: 'proof-review', limit: limits.proofReviewsPerDay });

  const trimmedContent = body.proofContent.trim();

  recordBusinessEvent('proof_submitted');

  // Trivially short proof: instant reject without Gemini.
  if (trimmedContent.length < 15) {
    recordBusinessEvent('proof_rejected');
    res.json({
      status: 'rejected',
      verdict: 'Proof is too short to evaluate.',
      feedbackToUser: 'Your proof looks weak. Give me a more specific summary - what exactly did you complete? A GitHub commit, a file name, or exact output.',
      score: 0,
      offline: false,
      provider: 'internal',
      tier: limits.tier,
    });
    return;
  }

  // GitHub proof: fast-path live verification (Pro only for live API, heuristic for free)
  let githubVerification = null;
  let enrichedContent = trimmedContent;
  if (body.proofType === 'github_link' || /github\.com|[a-f0-9]{7,40}/.test(trimmedContent)) {
    if (limits.githubProofEnabled) {
      githubVerification = await verifyGitHubProof(trimmedContent);
      if (githubVerification.isValid) {
        const summary = buildGitHubProofSummary(githubVerification);
        enrichedContent = `${trimmedContent}\n\nGitHub verification: ${summary}`;
      }
    } else {
      // Free tier: accept github links heuristically but flag as pro feature
      githubVerification = { isValid: true, reason: 'GitHub URL detected. Upgrade to Pro for live commit verification.' };
    }
  }

  // If GitHub live-verified, auto-classify as verified without Gemini.
  if (githubVerification?.isValid && limits.githubProofEnabled && body.proofType === 'github_link') {
    const result = {
      status: 'verified' as const,
      verdict: githubVerification.reason ?? 'GitHub commit verified.',
      feedbackToUser: `Proof verified. ${githubVerification.reason ?? ''} Keep shipping.`,
      score: 92,
    };
    recordBusinessEvent('proof_verified');
    recordBusinessEvent('github_proof_verified');
    await _persistProofResult(userId, body.taskId, result).catch(() => null);
    res.json({ ...result, offline: false, provider: 'github', tier: limits.tier, githubVerification });
    return;
  }

  const fallback = {
    status: 'weak' as const,
    verdict: 'Proof submitted but could not be AI-reviewed at this time.',
    feedbackToUser: 'Your proof looks weak. Give me a more specific summary - what exactly did you complete? A GitHub commit, a file name, or exact output.',
    score: 35,
  };

  const model = await generateGeminiText({
    systemInstruction: systemBase,
    prompt: proofReviewPrompt(body.taskTitle, body.proofType, enrichedContent),
    maxOutputTokens: 300,
    temperature: 0.2,
  });

  const parsed = model.offline
    ? fallback
    : parseJsonWithSchema(model.text, proofReviewOutputSchema, fallback);

  recordBusinessEvent(
    parsed.status === 'verified' ? 'proof_verified'
    : parsed.status === 'rejected' ? 'proof_rejected'
    : 'proof_weak'
  );
  await _persistProofResult(userId, body.taskId, parsed).catch(() => null);

  res.json({
    status: parsed.status,
    verdict: parsed.verdict,
    feedbackToUser: parsed.feedbackToUser,
    score: parsed.score,
    offline: model.offline,
    provider: model.offline ? 'internal' : 'gemini',
    tier: limits.tier,
    githubVerification,
  });
}));

async function _persistProofResult(
  userId: string,
  taskId: string,
  result: { status: string; score: number; feedbackToUser: string },
): Promise<void> {
  await db.doc(`users/${userId}/tasks/${taskId}`).set({
    proofStatus: result.status,
    proofScore: result.score,
    proofFeedback: result.feedbackToUser,
    proofReviewedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

const rewardSchema = z.object({
  action: z.string().min(1).max(100),
  reward: z.number().min(-1).max(1),
});

aiRouter.post('/reward', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const body = rewardSchema.parse(req.body);
  const result = await mlServiceClient.recordReward(userId, body.action, body.reward);
  if (!result.ok) {
    res.json({ success: false, reason: result.fallbackReason });
    return;
  }
  res.json({ success: true });
}));

aiRouter.get('/subscription', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const limits = await getTierLimits(userId);
  res.json({ ...limits, payments: getStripeConfigStatus() });
}));

const checkoutSchema = z.object({
  tier: z.enum(['pro', 'team']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

aiRouter.post('/subscription/checkout', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  if (!STRIPE_AVAILABLE) {
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
}));

aiRouter.post('/subscription/portal', asyncHandler(async (req, res) => {
  if (!STRIPE_AVAILABLE) {
    res.status(503).json({ error: { code: 'payments_unavailable', message: getStripeConfigStatus().message } });
    return;
  }
  const customerId = z.object({ customerId: z.string().min(1), returnUrl: z.string().url() }).parse(req.body);
  const result = await createPortalSession(customerId.customerId, customerId.returnUrl);
  if (!result.url) {
    res.status(503).json({ error: { code: 'portal_failed', message: result.error } });
    return;
  }
  res.json({ url: result.url });
}));
