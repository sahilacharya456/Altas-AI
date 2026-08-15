import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../lib/http';
import { env } from '../../config/env';
import { enforceUserQuota } from '../../services/quota';
import { getTierLimits } from '../../services/subscription';
import { runAltasAIOrchestrator } from '../../altasai';
import { retrieveSafeMemory } from '../../services/memory';
import { generateGeminiText, parseJsonWithSchema } from '../../services/gemini';
import { proofReviewPrompt, systemBase } from '../../services/prompts';
import { verifyGitHubProof, buildGitHubProofSummary } from '../../services/githubProof';
import { sanitizePrompt } from '../../services/security';
import { isProjectScopedInput, OUT_OF_CONTEXT_RESPONSE } from '../../services/projectScope';
import { logger } from '../../utils/logger';
import { recordBusinessEvent } from '../../services/metrics';
import { db, FieldValue } from '../../lib/firebaseAdmin';
import { z } from 'zod';

export const proofRouter = Router();

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

proofRouter.use(requireAuth);

async function persistProofResult(
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

proofRouter.post('/review', asyncHandler(async (req, res) => {
  const userId = requireUser(req);
  const body = proofReviewSchema.parse(req.body);
  const limits = await getTierLimits(userId);

  await enforceUserQuota(userId, { bucket: 'proof-review', limit: limits.proofReviewsPerDay });

  const trimmedContent = body.proofContent.trim();

  recordBusinessEvent('proof_submitted');

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
      githubVerification = { isValid: true, reason: 'GitHub URL detected. Upgrade to Pro for live commit verification.' };
    }
  }

  if (githubVerification?.isValid && limits.githubProofEnabled && body.proofType === 'github_link') {
    const result = {
      status: 'verified' as const,
      verdict: githubVerification.reason ?? 'GitHub commit verified.',
      feedbackToUser: `Proof verified. ${githubVerification.reason ?? ''} Keep shipping.`,
      score: 92,
    };
    recordBusinessEvent('proof_verified');
    recordBusinessEvent('github_proof_verified');
    try { await persistProofResult(userId, body.taskId, result); } catch (err) { logger.error('failed_to_persist_proof_result', { error: err }); }
    res.json({ ...result, offline: false, provider: 'github', tier: limits.tier, githubVerification });
    return;
  }

  const fallback = {
    status: 'weak' as const,
    verdict: 'Proof submitted but could not be AI-reviewed at this time.',
    feedbackToUser: 'Your proof looks weak. Give me a more specific summary - what exactly did you complete? A GitHub commit, a file name, or exact output.',
    score: 35,
  };

  const model = await withTimeout(generateGeminiText({
    systemInstruction: systemBase,
    prompt: proofReviewPrompt(body.taskTitle, body.proofType, enrichedContent),
    maxOutputTokens: 300,
    temperature: 0.2,
  }), 15000);

  const parsed = model.offline
    ? fallback
    : parseJsonWithSchema(model.text, proofReviewOutputSchema, fallback);

  recordBusinessEvent(
    parsed.status === 'verified' ? 'proof_verified'
    : parsed.status === 'rejected' ? 'proof_rejected'
    : 'proof_weak'
  );
  try { await persistProofResult(userId, body.taskId, parsed); } catch (err) { logger.error('failed_to_persist_proof_result', { error: err }); }

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