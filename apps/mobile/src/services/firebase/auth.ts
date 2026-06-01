/**
 * Firebase Authentication Service
 * Client-side auth using Firebase Auth
 */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User,
    UserCredential,
    updateProfile,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';

export interface AuthUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    emailVerified: boolean;
}

// Convert Firebase User to our AuthUser type
const toAuthUser = (user: User): AuthUser => ({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
});

/**
 * Sign up with email and password
 * Creates user in Firebase Auth and initializes Firestore profile
 */
export const signUp = async (
    email: string,
    password: string,
    displayName: string
): Promise<AuthUser> => {
    if (!isFirebaseConfigured) {
        throw new Error('Firebase is not configured. Add apps/mobile/.env values before creating an account.');
    }

    // Step 1: Create Firebase Auth user
    const credential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );

    // Step 2: Update display name
    await updateProfile(credential.user, { displayName });

    // Step 3: Create user profile in Firestore
    const profileData = {
        email,
        displayName,
        createdAt: serverTimestamp(),
        disciplineLevel: 'strict',
        focusAreas: [],
        lifeRhythm: {
            wakeTime: '06:00',
            sleepTime: '22:00',
        },
        currentScores: {
            discipline: 50,
            productivity: 50,
            consistency: 50,
        },
        onboardingCompleted: false,
    };

    await setDoc(doc(db, 'users', credential.user.uid, 'profile', 'data'), profileData);

    return toAuthUser(credential.user);
};

/**
 * Sign in with email and password
 */
export const signIn = async (
    email: string,
    password: string
): Promise<AuthUser> => {
    if (!isFirebaseConfigured) {
        throw new Error('Firebase is not configured. Add apps/mobile/.env values before signing in.');
    }

    const credential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
    );
    return toAuthUser(credential.user);
};

/**
 * Sign out current user
 */
export const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
};

/**
 * Send a Firebase password reset email.
 */
export const resetPassword = async (email: string): Promise<void> => {
    if (!isFirebaseConfigured) {
        throw new Error('Firebase is not configured. Add apps/mobile/.env values before sending reset email.');
    }

    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
};

/**
 * Get current user (null if not signed in)
 */
export const getCurrentUser = (): AuthUser | null => {
    const user = auth.currentUser;
    return user ? toAuthUser(user) : null;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthChange = (
    callback: (user: AuthUser | null) => void
): (() => void) => {
    return onAuthStateChanged(auth, (user) => {
        callback(user ? toAuthUser(user) : null);
    });
};

/**
 * Get current user's ID token for the AltasAI backend API.
 */
export const getIdToken = async (): Promise<string | null> => {
    const user = auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
};
