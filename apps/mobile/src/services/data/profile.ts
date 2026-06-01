/**
 * User Profile Data Service
 * Firestore operations for user profile
 */

import {
    getDocument,
    setDocument,
    updateDocument,
    subscribeToDocument,
} from '../firebase';
import { UserProfile } from '../../types/firestore';

const PROFILE_PATH = 'profile/data';

/**
 * Get user profile
 */
export const getProfile = async (): Promise<UserProfile | null> => {
    return getDocument<UserProfile>(PROFILE_PATH);
};

/**
 * Update user profile
 */
export const updateProfile = async (
    data: Partial<UserProfile>
): Promise<void> => {
    return updateDocument(PROFILE_PATH, data);
};

/**
 * Complete onboarding
 */
export const completeOnboarding = async (
    data: Pick<UserProfile, 'disciplineLevel' | 'focusAreas' | 'lifeRhythm'>
): Promise<void> => {
    return setDocument(PROFILE_PATH, {
        ...data,
        onboardingCompleted: true,
    }, true);
};

/**
 * Update discipline level
 */
export const updateDisciplineLevel = async (
    level: UserProfile['disciplineLevel']
): Promise<void> => {
    return updateDocument(PROFILE_PATH, { disciplineLevel: level });
};

/**
 * Update user scores
 */
export const updateScores = async (
    scores: Partial<UserProfile['currentScores']>
): Promise<void> => {
    const profile = await getProfile();
    if (!profile) return;

    return updateDocument(PROFILE_PATH, {
        currentScores: {
            ...profile.currentScores,
            ...scores,
        },
    });
};

/**
 * Update life rhythm settings
 */
export const updateLifeRhythm = async (
    lifeRhythm: Partial<UserProfile['lifeRhythm']>
): Promise<void> => {
    const profile = await getProfile();
    if (!profile) return;

    return updateDocument(PROFILE_PATH, {
        lifeRhythm: {
            ...profile.lifeRhythm,
            ...lifeRhythm,
        },
    });
};

/**
 * Subscribe to profile (real-time)
 */
export const subscribeToProfile = (
    callback: (profile: UserProfile | null) => void,
    onError?: (error: Error) => void
): (() => void) => {
    return subscribeToDocument<UserProfile>(PROFILE_PATH, callback, onError);
};
