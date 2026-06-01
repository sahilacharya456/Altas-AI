/**
 * Goals Store - Firestore Version
 * Zustand store for goals state with real-time Firestore sync
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
import { Goal } from '../types/firestore';


interface GoalsState {
    // State
    userId: string | null;
    goals: Goal[];
    selectedGoal: Goal | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    initialize: (userId: string) => () => void;
    loadGoals: () => Promise<void>;
    selectGoal: (goalId: string) => Promise<void>;
    addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'targetDate'> & { targetDate: Date }) => Promise<string>;
    editGoal: (goalId: string, data: Partial<Goal>) => Promise<void>;
    removeGoal: (goalId: string) => Promise<void>;
    markComplete: (goalId: string) => Promise<void>;
    setProgress: (goalId: string, progress: number) => Promise<void>;
    completeMilestone: (goalId: string, milestoneIndex: number) => Promise<void>;
    generateBreakdown: (goalId: string, title: string, description?: string) => Promise<string[]>;
    clearError: () => void;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
    // Initial state
    userId: null,
    goals: [],
    selectedGoal: null,
    isLoading: false,
    error: null,

    // Initialize with real-time subscription
    initialize: (userId: string) => {
        set({ isLoading: true, userId });

        const unsubscribe = subscribeToActiveGoals(userId, (goals) => {
            set({ goals, isLoading: false });
        });

        return unsubscribe;
    },

    // Load goals manually
    loadGoals: async () => {
        const { userId } = get();
        if (!userId) return;

        try {
            set({ isLoading: true, error: null });
            const goals = await getActiveGoals(userId);
            set({ goals, isLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load goals';
            set({ error: message, isLoading: false });
        }
    },

    // Select a goal
    selectGoal: async (goalId: string) => {
        try {
            const goal = await getGoal(goalId);
            set({ selectedGoal: goal });
        } catch (error) {
            // Silent fail
        }
    },


    // Add a new goal
    addGoal: async (goalData) => {
        try {
            set({ isLoading: true, error: null });
            const dataToSave = {
                ...goalData,
                targetDate: Timestamp.fromDate(goalData.targetDate),
            };
            const goalId = await createGoal(dataToSave as any);
            set({ isLoading: false });
            return goalId;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create goal';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    // Edit a goal
    editGoal: async (goalId, data) => {
        try {
            set({ isLoading: true, error: null });
            await updateGoal(goalId, data);
            set({ isLoading: false });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update goal';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    // Remove a goal
    removeGoal: async (goalId) => {
        try {
            set({ isLoading: true, error: null });
            await deleteGoal(goalId);
            set({ isLoading: false, selectedGoal: null });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete goal';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    // Mark goal as complete
    markComplete: async (goalId) => {
        try {
            set({ error: null });
            await completeGoal(goalId);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to complete goal';
            set({ error: message });
            throw error;
        }
    },

    // Set goal progress
    setProgress: async (goalId, progress) => {
        try {
            await updateGoalProgress(goalId, progress);
        } catch (error) {
            // Silent fail
        }
    },

    // Complete a milestone
    completeMilestone: async (goalId, milestoneIndex) => {
        try {
            await completeMilestone(goalId, milestoneIndex);

            // Refresh selected goal if it's the one being updated
            if (get().selectedGoal?.id === goalId) {
                await get().selectGoal(goalId);
            }
        } catch (error) {
            // Silent fail
        }
    },

    // Generate AI breakdown for a goal
    generateBreakdown: async (goalId, title, description) => {
        try {
            set({ isLoading: true, error: null });
            const milestones = await generateGoalBreakdown(goalId, title, description);
            set({ isLoading: false });

            // Refresh selected goal if it's the one being updated
            if (get().selectedGoal?.id === goalId) {
                await get().selectGoal(goalId);
            }

            return milestones;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to generate breakdown';
            set({ error: message, isLoading: false });
            throw error;
        }
    },

    // Clear error
    clearError: () => set({ error: null }),
}));

// Selectors
export const selectActiveGoals = (state: GoalsState) =>
    state.goals.filter(g => g.status === 'active');
export const selectGoalsByCategory = (state: GoalsState, category: Goal['category']) =>
    state.goals.filter(g => g.category === category);
export const selectGoalProgress = (state: GoalsState) => {
    const goals = state.goals;
    if (goals.length === 0) return 0;
    return Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length);
};
