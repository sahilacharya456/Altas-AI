import { create } from 'zustand';
import { callBackendGet } from '../services/ai/backendClient';

export type SubscriptionTier = 'free' | 'pro' | 'team';

export interface TierLimits {
  tier: SubscriptionTier;
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
  payments?: {
    available: boolean;
    hasCheckoutKey: boolean;
    hasProPrice: boolean;
    hasTeamPrice: boolean;
    hasWebhookSecret: boolean;
    message: string;
  };
}

const FREE_LIMITS: TierLimits = {
  tier: 'free',
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
};

interface SubscriptionState {
  limits: TierLimits;
  isLoading: boolean;
  lastFetchedAt: number | null;
  fetch: () => Promise<void>;
  isPro: () => boolean;
  isTeam: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  limits: FREE_LIMITS,
  isLoading: false,
  lastFetchedAt: null,

  fetch: async () => {
    const { lastFetchedAt, isLoading } = get();
    if (isLoading) return;
    // Cache for 5 minutes
    if (lastFetchedAt && Date.now() - lastFetchedAt < 5 * 60 * 1000) return;

    set({ isLoading: true });
    try {
      const limits = await callBackendGet<TierLimits>('/api/subscription');
      set({ limits, isLoading: false, lastFetchedAt: Date.now() });
    } catch {
      set({ isLoading: false });
    }
  },

  isPro: () => {
    const { tier } = get().limits;
    return tier === 'pro' || tier === 'team';
  },

  isTeam: () => get().limits.tier === 'team',
}));
