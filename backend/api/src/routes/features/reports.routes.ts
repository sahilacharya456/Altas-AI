import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../lib/http';
import { env } from '../../config/env';
import { enforceUserQuota } from '../../services/quota';
import { runAltasAIOrchestrator, runReportInsight } from '../../altasai';
import { retrieveSafeMemory } from '../../services/memory';
import { generateGeminiText, parseJsonWithSchema } from '../../services/gemini';
import { dailyBriefingPrompt, weeklyReportPrompt, systemBase } from '../../services/prompts';
import { sanitizePrompt } from '../../services/security';
import { isProjectScopedInput, OUT_OF_CONTEXT_RESPONSE } from '../../services/projectScope';
import { logger } from '../../utils/logger';
import { recordBusinessEvent } from '../../services/metrics';
import { z } from 'zod';

export const reportsRouter = Router();

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

reportsRouter.use(requireAuth);

reportsRouter.post('/daily-briefing', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const input = sanitizePrompt(typeof req.body?.input === 'string' ? req.body.input.slice(0, 1000) : undefined);
  
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
  
  const model = await withTimeout(generateGeminiText({
    systemInstruction: systemBase,
    prompt: dailyBriefingPrompt(input, memory),
  }), 15000);
  
  res.json({ 
    output: model.offline ? fallback : parseJsonWithSchema(model.text, dailyBriefingOutputSchema, fallback), 
    offline: model.offline, 
    internalInsight: insight, 
    orchestration 
  });
  
  recordBusinessEvent('daily_briefing_generated');
}));

reportsRouter.post('/weekly-report', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const input = sanitizePrompt(typeof req.body?.input === 'string' ? req.body.input.slice(0, 1000) : undefined);
  
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
  
  const model = await withTimeout(generateGeminiText({
    systemInstruction: systemBase,
    prompt: weeklyReportPrompt(input, memory),
    maxOutputTokens: 850,
  }), 15000);
  
  res.json({ 
    output: model.offline ? fallback : parseJsonWithSchema(model.text, weeklyReportOutputSchema, fallback), 
    offline: model.offline, 
    internalInsight: insight, 
    orchestration 
  });
  
  recordBusinessEvent('weekly_report_generated');
}));