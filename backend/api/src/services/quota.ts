import { db, FieldValue } from '../lib/firebaseAdmin';
import { ApiError } from '../lib/http';
import { logger } from '../utils/logger';

export interface QuotaOptions {
  limit: number;
  bucket: string;
  now?: Date;
}

const localBuckets = new Map<string, { count: number; resetAt: number }>();

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

const enforceLocalQuota = (userId: string, { limit, bucket, now = new Date() }: QuotaOptions) => {
  const key = `${userId}:${bucket}:${dayKey(now)}`;
  const resetAt = new Date(now);
  resetAt.setUTCHours(24, 0, 0, 0);
  const current = localBuckets.get(key) ?? { count: 0, resetAt: resetAt.getTime() };
  if (current.count >= limit) {
    throw new ApiError(429, 'Daily AltasAI quota exceeded. Try again tomorrow or reduce repeated AI requests.', 'quota_exceeded');
  }
  current.count += 1;
  localBuckets.set(key, current);
  return { count: current.count, limit };
};

export const enforceUserQuota = async (userId: string, options: QuotaOptions) => {
  const now = options.now ?? new Date();
  const key = `${userId}_${options.bucket}_${dayKey(now)}`;
  const ref = db.collection('serverQuotas').doc(key);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      const current = Number(snap.data()?.count ?? 0);
      if (current >= options.limit) {
        throw new ApiError(429, 'Daily AltasAI quota exceeded. Try again tomorrow or reduce repeated AI requests.', 'quota_exceeded');
      }
      transaction.set(ref, {
        userId,
        bucket: options.bucket,
        day: dayKey(now),
        count: FieldValue.increment(1),
        limit: options.limit,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return { count: current + 1, limit: options.limit };
    });
    return result;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.warn('quota.firestore_fallback', { userId, bucket: options.bucket, error: error instanceof Error ? error.message : String(error) });
    return enforceLocalQuota(userId, options);
  }
};
