/**
 * User Profile Data Service
 * Firestore operations for user profile
 */

import {
    getDocument,
    setDocument,
    subscribeToDocument,
    Timestamp,
} from '../firebase';
import { UserProfile } from '../../types/firestore';

const PROFILE_PATH = 'profile/data';

const DEFAULT_LIFE_RHYTHM: UserProfile['lifeRhythm'] = {
    wakeTime: '06:00',
    sleepTime: '22:00',
};

const DEFAULT_SCORES: UserProfile['currentScores'] = {
    discipline: 50,
    productivity: 50,
    consistency: 50,
};

export type ProfileUpdateInput = Partial<Omit<UserProfile, 'lifeRhythm' | 'currentScores'>> & {
    lifeRhythm?: Partial<UserProfile['lifeRhythm']>;
    currentScores?: Partial<UserProfile['currentScores']>;
};

export const buildProfileUpdatePayload = (
    current: UserProfile | null,
    data: ProfileUpdateInput
): Omit<UserProfile, 'id' | 'updatedAt'> => ({
    email: data.email ?? current?.email ?? '',
    displayName: data.displayName?.trim() || current?.displayName || 'Commander',
    createdAt: data.createdAt ?? current?.createdAt ?? Timestamp.now(),
    disciplineLevel: data.disciplineLevel ?? current?.disciplineLevel ?? 'strict',
    focusAreas: data.focusAreas ?? current?.focusAreas ?? [],
    lifeRhythm: {
        ...DEFAULT_LIFE_RHYTHM,
        ...current?.lifeRhythm,
        ...data.lifeRhythm,
    },
    currentScores: {
        ...DEFAULT_SCORES,
        ...current?.currentScores,
        ...data.currentScores,
    },
    onboardingCompleted: data.onboardingCompleted ?? current?.onboardingCompleted ?? false,
});

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
    data: ProfileUpdateInput
): Promise<void> => {
    let current: UserProfile | null = null;
    try {
        current = await getProfile();
    } catch {
        current = null;
    }

    return setDocument<UserProfile>(
        PROFILE_PATH,
        buildProfileUpdatePayload(current, data),
        true
    );
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
    return updateProfile({ disciplineLevel: level });
};

/**
 * Update user scores
 */
export const updateScores = async (
    scores: Partial<UserProfile['currentScores']>
): Promise<void> => {
    const profile = await getProfile();
    if (!profile) return;

    return updateProfile({
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

    return updateProfile({
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
