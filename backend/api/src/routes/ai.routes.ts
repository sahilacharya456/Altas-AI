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
import { recommendationsRouter } from './recommendations.routes';
import {
  budgetPrompt,
  dailyBriefingPrompt,
  goalBreakdownPrompt,
  interventionPrompt,
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

const mentorSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  conversationId: z.string().trim().max(200).optional(),
  contextType: z.enum(['general', 'morning', 'task_review', 'reflection']).optional(),
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
  await enforceUserQuota(userId, { bucket: 'mentor', limit: env.aiDailyQuota });
  const memory = await retrieveSafeMemory(userId);
  const result = await runMentorOrchestration({
    userId,
    message: body.message,
    memory,
  }, { enhanceWithGemini: true });
  const response = result.response;

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
    },
    createdAt: FieldValue.serverTimestamp(),
  });

  res.json({
    response,
    conversationId: conversationRef.id,
    offline: result.offline,
    provider: result.provider,
    intent: result.plan.intent,
    recommendations: result.plan.recommendations,
  });
}));

aiRouter.post('/daily-briefing', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  await enforceUserQuota(userId, { bucket: 'daily-briefing', limit: env.aiDailyQuota });
  const input = typeof req.body?.input === 'string' ? req.body.input.slice(0, 1000) : undefined;
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
  await enforceUserQuota(userId, { bucket: 'weekly-report', limit: env.aiDailyQuota });
  const input = typeof req.body?.input === 'string' ? req.body.input.slice(0, 1000) : undefined;
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
  await enforceUserQuota(userId, { bucket: 'goal-breakdown', limit: env.aiDailyQuota });
  const body = goalSchema.parse(req.body);
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

aiRouter.post('/reflection-feedback', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  await enforceUserQuota(userId, { bucket: 'reflection-feedback', limit: env.aiDailyQuota });
  const body = reflectionSchema.parse(req.body);
  const ref = db.doc(`users/${userId}/dailyLogs/${body.date}`);
  const snap = await ref.get();
  if (!snap.exists) throw new ApiError(404, 'Reflection not found.', 'not_found');
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
  await enforceUserQuota(userId, { bucket: 'interventions', limit: env.aiDailyQuota });
  const input = typeof req.body?.input === 'string' ? req.body.input.slice(0, 1000) : undefined;
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
  await enforceUserQuota(userId, { bucket: 'security-advice', limit: env.aiDailyQuota });
  const input = z.object({ input: z.string().min(1).max(2000) }).parse(req.body).input;
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
  await enforceUserQuota(userId, { bucket: 'cortex', limit: env.aiDailyQuota });
  const input = typeof req.body?.input === 'string' ? req.body.input.slice(0, 1000) : 'cortex insight';
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
