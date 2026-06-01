/**
 * Goals Data Service
 * Firestore operations for goals collection
 */

import {
    addDocument,
    getDocument,
    updateDocument,
    deleteDocument,
    queryCollection,
    subscribeToCollection,
    where,
    orderBy,
    Timestamp,
} from '../firebase';
import { Goal } from '../../types/firestore';

const COLLECTION = 'goals';

const getMillis = (value: Goal['targetDate'] | Goal['createdAt']): number => {
    if (value && typeof value === 'object' && 'toDate' in value) {
        return value.toDate().getTime();
    }
    return new Date(value as unknown as Date).getTime();
};

/**
 * Create a new goal
 */
export const createGoal = async (
    data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'progress'>
): Promise<string> => {
    return addDocument<Goal>(COLLECTION, {
        ...data,
        progress: 0,
        status: 'active',
    } as Omit<Goal, 'id'>);
};

/**
 * Get a goal by ID
 */
export const getGoal = async (goalId: string): Promise<Goal | null> => {
    return getDocument<Goal>(`${COLLECTION}/${goalId}`);
};

/**
 * Update a goal
 */
export const updateGoal = async (
    goalId: string,
    data: Partial<Goal>
): Promise<void> => {
    return updateDocument(`${COLLECTION}/${goalId}`, data);
};

/**
 * Delete a goal
 */
export const deleteGoal = async (goalId: string): Promise<void> => {
    return deleteDocument(`${COLLECTION}/${goalId}`);
};

/**
 * Mark goal as completed
 */
export const completeGoal = async (goalId: string): Promise<void> => {
    return updateDocument(`${COLLECTION}/${goalId}`, {
        status: 'completed',
        progress: 100,
    });
};

/**
 * Update goal progress
 */
export const updateGoalProgress = async (
    goalId: string,
    progress: number
): Promise<void> => {
    return updateDocument(`${COLLECTION}/${goalId}`, {
        progress: Math.min(100, Math.max(0, progress)),
    });
};

/**
 * Complete a milestone
 */
export const completeMilestone = async (
    goalId: string,
    milestoneIndex: number
): Promise<void> => {
    const goal = await getGoal(goalId);
    if (!goal || !goal.milestones) return;

    const milestones = [...goal.milestones];
    if (milestoneIndex < milestones.length) {
        milestones[milestoneIndex] = {
            ...milestones[milestoneIndex],
            completed: true,
            completedAt: Timestamp.now(),
        };

        // Calculate new progress based on milestones
        const completedCount = milestones.filter(m => m.completed).length;
        const progress = Math.round((completedCount / milestones.length) * 100);

        await updateDocument(`${COLLECTION}/${goalId}`, {
            milestones,
            progress,
        });
    }
};

/**
 * Get all active goals
 */
export const getActiveGoals = async (_userId: string): Promise<Goal[]> => {
    const goals = await queryCollection<Goal>(COLLECTION, [
        where('status', '==', 'active'),
    ]);
    return goals.sort((a, b) => getMillis(a.targetDate) - getMillis(b.targetDate));
};

/**
 * Get all goals
 */
export const getAllGoals = async (_userId: string): Promise<Goal[]> => {
    return queryCollection<Goal>(COLLECTION, [
        orderBy('createdAt', 'desc'),
    ]);
};

/**
 * Subscribe to active goals (real-time)
 */
export const subscribeToActiveGoals = (
    userId: string,
    callback: (goals: Goal[]) => void
): (() => void) => {
    return subscribeToCollection<Goal>(COLLECTION, (goals) => {
        callback(goals.sort((a, b) => getMillis(a.targetDate) - getMillis(b.targetDate)));
    }, [
        where('status', '==', 'active'),
    ]);
};

/**
 * Get goals by category
 */
export const getGoalsByCategory = async (
    userId: string,
    category: Goal['category']
): Promise<Goal[]> => {
    const goals = await queryCollection<Goal>(COLLECTION, [
        where('category', '==', category),
        where('status', '==', 'active'),
    ]);
    return goals.sort((a, b) => getMillis(a.targetDate) - getMillis(b.targetDate));
};

/**
 * Store AI breakdown for a goal
 */
export const storeAIBreakdown = async (
    goalId: string,
    breakdown: string[]
): Promise<void> => {
    return updateDocument(`${COLLECTION}/${goalId}`, {
        aiBreakdown: breakdown,
    });
};
