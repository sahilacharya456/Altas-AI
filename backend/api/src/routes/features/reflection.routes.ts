import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../lib/http';
import { env } from '../../config/env';
import { enforceUserQuota } from '../../services/quota';
import { generateGeminiText, parseJsonWithSchema } from '../../services/gemini';
import { reflectionFeedbackPrompt, budgetPrompt, securityPrompt, systemBase } from '../../services/prompts';
import { sanitizePrompt } from '../../services/security';
import { isProjectScopedInput, OUT_OF_CONTEXT_RESPONSE } from '../../services/projectScope';
import { db, FieldValue } from '../../lib/firebaseAdmin';
import { logger } from '../../utils/logger';
import { recordBusinessEvent } from '../../services/metrics';
import { z } from 'zod';

export const reflectionRouter = Router();

const reflectionOutputSchema = z.object({
  feedback: z.string(),
  pattern: z.string(),
  tomorrowAction: z.string(),
});

const reflectionSchema = z.object({
  date: z.string().min(1).max(80),
});

const getDailyLogRefs = (userId: string, date: string) => {
  const ids = date.startsWith(`${userId}_`) ? [date] : [date, `${userId}_${date}`];
  return [...new Set(ids)].map((id) => db.doc(`users/${userId}/dailyLogs/${id}`));
};

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

reflectionRouter.use(requireAuth);

reflectionRouter.post('/feedback', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  await enforceUserQuota(userId, { bucket: 'reflection-feedback', limit: env.aiDailyQuota });
  const body = reflectionSchema.parse(req.body);
  
  let ref = null;
  let snap = null;

  for (const candidate of getDailyLogRefs(userId, body.date)) {
    const candidateSnap = await candidate.get();
    if (candidateSnap.exists) {
      ref = candidate;
      snap = candidateSnap;
      break;
    }
  }

  if (!ref || !snap) {
    res.status(404).json({ error: { code: 'not_found', message: 'Reflection not found.' } });
    return;
  }
  
  const fallback = {
    feedback: 'Reflection captured. Pick one tomorrow priority and protect the first work block.',
    pattern: 'Execution improves when the next action is small.',
    tomorrowAction: 'Choose one priority before opening secondary tasks.',
  };
  
  const model = await withTimeout(generateGeminiText({
    systemInstruction: systemBase,
    prompt: reflectionFeedbackPrompt(snap.data() ?? {}),
    maxOutputTokens: 500,
  }), 15000);
  
  const parsed = model.offline ? fallback : parseJsonWithSchema(model.text, reflectionOutputSchema, fallback);
  await ref.set({ mentorFeedback: parsed.feedback, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  
  res.json({ feedback: parsed.feedback, pattern: parsed.pattern, tomorrowAction: parsed.tomorrowAction, offline: model.offline });
  recordBusinessEvent('reflection_feedback_generated');
}));