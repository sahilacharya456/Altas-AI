import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../lib/http';
import { db, FieldValue } from '../lib/firebaseAdmin';
import { enforceUserQuota } from '../services/quota';
import { recordBusinessEvent } from '../services/metrics';

import rateLimit from 'express-rate-limit';

export const proofFeedRouter = Router();

// Add strict rate limiter for the public feed endpoint
const publicFeedLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per `window` (here, per minute)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'rate_limited', message: 'Too many requests to proof feed.' } },
});

// 60-second in-process cache for the public feed
let feedCache: { items: unknown[]; cachedAt: number } | null = null;
const FEED_CACHE_TTL_MS = 60_000;

const CATEGORY_LABELS: Record<string, string> = {
  career: 'Career',
  study: 'Study',
  health: 'Health',
  fitness: 'Fitness',
  personal: 'Personal',
  routine: 'Routine',
};

const maskTitle = (title: string): string => {
  const words = title.trim().split(/\s+/);
  if (words.length <= 3) return `${words.join(' ')}...`;
  return `${words.slice(0, 3).join(' ')}...`;
};

const publishSchema = z.object({
  taskId: z.string().min(1).max(200),
  taskTitle: z.string().min(1).max(500),
  category: z.enum(['career', 'study', 'health', 'fitness', 'personal', 'routine']),
  proofType: z.enum(['text', 'github_link', 'file', 'study_notes', 'other']),
  score: z.number().min(70).max(100),
  disciplineMode: z.string().max(30).optional(),
});

// POST /api/proof-feed/publish: authenticated, only verified proofs (score >= 70).
proofFeedRouter.post('/publish', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user?.uid;
  if (!userId) { res.status(401).json({ error: { code: 'unauthenticated' } }); return; }

  const body = publishSchema.parse(req.body);

  // Max 1 publish per user per hour
  await enforceUserQuota(userId, { bucket: 'proof-feed-publish', limit: 5 });

  const doc = await db.collection('proofFeed').add({
    category: body.category,
    categoryLabel: CATEGORY_LABELS[body.category] ?? body.category,
    proofType: body.proofType,
    taskTitleMasked: maskTitle(body.taskTitle),
    score: body.score,
    disciplineMode: body.disciplineMode ?? 'strict',
    publishedAt: FieldValue.serverTimestamp(),
    // userId intentionally omitted: feed is anonymous.
  });

  // Invalidate feed cache
  feedCache = null;

  recordBusinessEvent('proof_feed_published');

  res.json({ ok: true, feedId: doc.id });
}));

// GET /api/proof-feed/recent: public, no auth required.
proofFeedRouter.get('/recent', publicFeedLimiter, asyncHandler(async (_req, res) => {
  if (feedCache && Date.now() - feedCache.cachedAt < FEED_CACHE_TTL_MS) {
    res.json({ items: feedCache.items, cached: true });
    return;
  }

  const snap = await db.collection('proofFeed')
    .orderBy('publishedAt', 'desc')
    .limit(20)
    .get();

  const items = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    publishedAt: doc.data().publishedAt?.toDate?.()?.toISOString() ?? null,
  }));

  feedCache = { items, cachedAt: Date.now() };
  res.json({ items, cached: false });
}));
