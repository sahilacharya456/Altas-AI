/**
 * Goals Store — Zustand store for goals state with real-time Firestore sync.
 */

import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';
import {
  createGoal,
  getGoal,
  updateGoal,
  deleteGoal,
  completeGoal,
  updateGoalProgress,
  completeMilestone,
  getActiveGoals,
  subscribeToActiveGoals,
} from '../services/data';
import { generateGoalBreakdown } from '../services/ai';
import type { Goal } from '../types/firestore';
import { getErrorMessage } from '../utils/errors';
import { logger } from '../utils/logger';

interface GoalCreateDTO extends Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'targetDate'> {
  targetDate: Date;
}

interface GoalsState {
  userId: string | null;
  goals: Goal[];
  selectedGoal: Goal | null;
  isLoading: boolean;
  error: string | null;

  initialize: (userId: string) => () => void;
  loadGoals: () => Promise<void>;
  selectGoal: (goalId: string) => Promise<void>;
  addGoal: (goal: GoalCreateDTO) => Promise<string>;
  editGoal: (goalId: string, data: Partial<Goal>) => Promise<void>;
  removeGoal: (goalId: string) => Promise<void>;
  markComplete: (goalId: string) => Promise<void>;
  setProgress: (goalId: string, progress: number) => Promise<void>;
  completeMilestone: (goalId: string, milestoneIndex: number) => Promise<void>;
  generateBreakdown: (goalId: string, title: string, description?: string) => Promise<string[]>;
  clearError: () => void;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  userId: null,
  goals: [],
  selectedGoal: null,
  isLoading: false,
  error: null,

  initialize: (userId) => {
    set({ isLoading: true, userId });
    const unsubscribe = subscribeToActiveGoals(
      userId,
      (goals) => set({ goals, isLoading: false, error: null }),
      (error) => {
        logger.error('Goals subscription error', error, 'GoalsStore');
        set({ error: getErrorMessage(error, 'Failed to load goals'), isLoading: false });
      }
    );
    return unsubscribe;
  },

  loadGoals: async () => {
    const { userId } = get();
    if (!userId) return;
    try {
      set({ isLoading: true, error: null });
      const goals = await getActiveGoals(userId);
      set({ goals, isLoading: false });
    } catch (error) {
      logger.error('Load goals failed', error, 'GoalsStore');
      set({ error: getErrorMessage(error, 'Failed to load goals'), isLoading: false });
    }
  },

  selectGoal: async (goalId) => {
    try {
      const goal = await getGoal(goalId);
      set({ selectedGoal: goal });
    } catch (error) {
      // Non-critical UI fetch — log but don't surface to user
      logger.warn('Select goal fetch failed', error, 'GoalsStore');
    }
  },

  addGoal: async (goalData) => {
    try {
      set({ isLoading: true, error: null });
      const dataToSave: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
        ...goalData,
        description: goalData.description ?? '',
        milestones: goalData.milestones ?? [],
        aiBreakdown: goalData.aiBreakdown ?? [],
        progress: 0,
        targetDate: Timestamp.fromDate(goalData.targetDate),
      };
      const goalId = await createGoal(dataToSave);
      set({ isLoading: false });
      return goalId;
    } catch (error) {
      logger.error('Create goal failed', error, 'GoalsStore');
      const message = getErrorMessage(error, 'Failed to create goal');
      const isOffline =
        error instanceof Error &&
        (error.message.includes('Missing or insufficient permissions') ||
          error.message.toLowerCase().includes('network'));

      if (isOffline) {
        const now = Timestamp.now();
        const localGoalId = `local_${Date.now()}`;
        const localGoal: Goal = {
          id: localGoalId,
          userId: goalData.userId,
          title: goalData.title,
          description: goalData.description ?? '',
          category: goalData.category,
          priority: goalData.priority,
          targetDate: Timestamp.fromDate(goalData.targetDate),
          status: goalData.status ?? 'active',
          progress: 0,
          milestones: goalData.milestones ?? [],
          aiBreakdown: goalData.aiBreakdown ?? [],
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          goals: [localGoal, ...state.goals],
          isLoading: false,
          error: `${message} Goal saved locally — will sync when connection restores.`,
        }));
        logger.warn('Goal saved locally (offline fallback)', { localGoalId }, 'GoalsStore');
        return localGoalId;
      }

      set({ error: message, isLoading: false });
      throw error;
    }
  },

  editGoal: async (goalId, data) => {
    try {
      set({ isLoading: true, error: null });
      await updateGoal(goalId, data);
      set({ isLoading: false });
    } catch (error) {
      logger.error('Edit goal failed', error, 'GoalsStore');
      set({ error: getErrorMessage(error, 'Failed to update goal'), isLoading: false });
      throw error;
    }
  },

  removeGoal: async (goalId) => {
    try {
      set({ isLoading: true, error: null });
      await deleteGoal(goalId);
      set({ isLoading: false, selectedGoal: null });
    } catch (error) {
      logger.error('Delete goal failed', error, 'GoalsStore');
      set({ error: getErrorMessage(error, 'Failed to delete goal'), isLoading: false });
      throw error;
    }
  },

  markComplete: async (goalId) => {
    try {
      set({ error: null });
      await completeGoal(goalId);
    } catch (error) {
      logger.error('Complete goal failed', error, 'GoalsStore');
      set({ error: getErrorMessage(error, 'Failed to complete goal') });
      throw error;
    }
  },

  setProgress: async (goalId, progress) => {
    try {
      await updateGoalProgress(goalId, progress);
    } catch (error) {
      logger.warn('Set goal progress failed', error, 'GoalsStore');
      // Non-critical — optimistic UI already reflects change
    }
  },

  completeMilestone: async (goalId, milestoneIndex) => {
    try {
      await completeMilestone(goalId, milestoneIndex);
      if (get().selectedGoal?.id === goalId) {
        await get().selectGoal(goalId);
      }
    } catch (error) {
      logger.error('Complete milestone failed', error, 'GoalsStore');
      // Surface this since milestone completion is user-visible
      set({ error: getErrorMessage(error, 'Failed to complete milestone') });
    }
  },

  generateBreakdown: async (goalId, title, description) => {
    try {
      set({ isLoading: true, error: null });
      const milestones = await generateGoalBreakdown(goalId, title, description);
      set((state) => ({
        goals: state.goals.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                aiBreakdown: milestones,
                milestones: goal.milestones?.length
                  ? goal.milestones
                  : milestones.map((milestone) => ({ title: milestone, completed: false })),
              }
            : goal
        ),
        isLoading: false,
      }));
      if (get().selectedGoal?.id === goalId) {
        await get().selectGoal(goalId);
      }
      return milestones;
    } catch (error) {
      logger.error('Generate breakdown failed', error, 'GoalsStore');
      set({ error: getErrorMessage(error, 'Failed to generate breakdown'), isLoading: false });
      return [];
    }
  },

  clearError: () => set({ error: null }),
}));

// Selectors
export const selectActiveGoals = (state: GoalsState): Goal[] =>
  state.goals.filter((g) => g.status === 'active');
export const selectGoalsByCategory = (state: GoalsState, category: Goal['category']): Goal[] =>
  state.goals.filter((g) => g.category === category);
export const selectGoalProgress = (state: GoalsState): number => {
  if (state.goals.length === 0) return 0;
  return Math.round(state.goals.reduce((sum, g) => sum + g.progress, 0) / state.goals.length);
};
