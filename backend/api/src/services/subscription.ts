import { db, FieldValue } from '../lib/firebaseAdmin';
import { logger } from '../utils/logger';

export type SubscriptionTier = 'free' | 'pro' | 'team';

export interface UserSubscription {
  tier: SubscriptionTier;
  expiresAt?: Date;
  teamId?: string;
}

export interface TierLimits {
  dailyMentorMessages: number;
  proofReviewsPerDay: number;
  activeTaskLimit: number;
  activeGoalLimit: number;
  ragMemoryEnabled: boolean;
  conversationHistoryEnabled: boolean;
  githubProofEnabled: boolean;
  voiceEnabled: boolean;
  analyticsEnabled: boolean;
  reportGenerationEnabled: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    dailyMentorMessages: 20,
    proofReviewsPerDay: 5,
    activeTaskLimit: 5,
    activeGoalLimit: 2,
    ragMemoryEnabled: false,
    conversationHistoryEnabled: false,
    githubProofEnabled: false,
    voiceEnabled: false,
    analyticsEnabled: false,
    reportGenerationEnabled: false,
  },
  pro: {
    dailyMentorMessages: 60,
    proofReviewsPerDay: 50,
    activeTaskLimit: 200,
    activeGoalLimit: 20,
    ragMemoryEnabled: true,
    conversationHistoryEnabled: true,
    githubProofEnabled: true,
    voiceEnabled: true,
    analyticsEnabled: true,
    reportGenerationEnabled: true,
  },
  team: {
    dailyMentorMessages: 120,
    proofReviewsPerDay: 100,
    activeTaskLimit: 500,
    activeGoalLimit: 50,
    ragMemoryEnabled: true,
    conversationHistoryEnabled: true,
    githubProofEnabled: true,
    voiceEnabled: true,
    analyticsEnabled: true,
    reportGenerationEnabled: true,
  },
};

const SUBSCRIPTION_CACHE = new Map<string, { sub: UserSubscription; fetchedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const getUserSubscription = async (userId: string): Promise<UserSubscription> => {
  const cached = SUBSCRIPTION_CACHE.get(userId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.sub;
  }

  try {
    const snap = await db.doc(`users/${userId}/subscription/data`).get();
    if (!snap.exists) {
      const sub: UserSubscription = { tier: 'free' };
      SUBSCRIPTION_CACHE.set(userId, { sub, fetchedAt: Date.now() });
      return sub;
    }

    const data = snap.data()!;
    const expiresAt = data.expiresAt?.toDate?.() as Date | undefined;
    const tier: SubscriptionTier =
      expiresAt && expiresAt > new Date() && ['pro', 'team'].includes(data.tier)
        ? (data.tier as SubscriptionTier)
        : 'free';

    const sub: UserSubscription = { tier, expiresAt, teamId: data.teamId };
    SUBSCRIPTION_CACHE.set(userId, { sub, fetchedAt: Date.now() });
    return sub;
  } catch (error) {
    logger.warn('subscription.fetch_failed', { userId, error: error instanceof Error ? error.message : String(error) });
    return { tier: 'free' };
  }
};

export const getTierLimits = async (userId: string): Promise<TierLimits & { tier: SubscriptionTier }> => {
  const sub = await getUserSubscription(userId);
  return { ...TIER_LIMITS[sub.tier], tier: sub.tier };
};

export const grantProAccess = async (userId: string, durationDays = 30): Promise<void> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);
  await db.doc(`users/${userId}/subscription/data`).set({
    tier: 'pro',
    expiresAt,
    grantedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  SUBSCRIPTION_CACHE.delete(userId);
};

export const invalidateSubscriptionCache = (userId: string): void => {
  SUBSCRIPTION_CACHE.delete(userId);
};
