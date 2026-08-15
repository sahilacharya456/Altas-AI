/**
 * Auth Store — Zustand store for Firebase authentication state.
 * Manages user, profile, loading, and error state with real-time Firestore sync.
 */

import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';
import {
  signUp,
  signIn,
  signOut,
  onAuthChange,
  getCurrentUser,
  resetPassword,
  type AuthUser,
} from '../services/firebase';
import {
  getProfile,
  completeOnboarding as completeOnboardingData,
  updateProfile as updateProfileData,
  subscribeToProfile,
} from '../services/data';
import type { UserProfile } from '../types/firestore';
import { logger } from '../utils/logger';

interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  /** @internal Firebase listener cleanup functions. */
  _authUnsubscribe: (() => void) | null;
  _profileUnsubscribe: (() => void) | null;
  /** @internal Token used to cancel stale async profile loads. */
  _profileLoadToken: number;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (data: {
    disciplineLevel: UserProfile['disciplineLevel'];
    focusAreas: UserProfile['focusAreas'];
    lifeRhythm: UserProfile['lifeRhythm'];
  }) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  _cleanup: () => void;
}

const PROFILE_READ_TIMEOUT_MS = 4_500;

const getProfileWithTimeout = async (): Promise<UserProfile | null> => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      getProfile(),
      new Promise<UserProfile | null>((resolve) => {
        timeout = setTimeout(() => resolve(null), PROFILE_READ_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
  _authUnsubscribe: null,
  _profileUnsubscribe: null,
  _profileLoadToken: 0,

  initialize: async () => {
    if (get()._authUnsubscribe) return;
    set({ isLoading: true, error: null });

    const authUnsubscribe = onAuthChange(async (user) => {
      if (user) {
        const token = get()._profileLoadToken + 1;
        set({ _profileLoadToken: token, user, isAuthenticated: true, isLoading: true });

        get()._profileUnsubscribe?.();

        void getProfileWithTimeout()
          .then((profile) => {
            if (get()._profileLoadToken !== token) return;
            set({ profile, isLoading: false, isInitialized: true });
          })
          .catch((error) => {
            if (get()._profileLoadToken !== token) return;
            logger.error('Initial profile load failed', error, 'AuthStore');
            set({ profile: null, isLoading: false, isInitialized: true, error: null });
          });

        const profileUnsubscribe = subscribeToProfile(
          (profile) => {
            if (get()._profileLoadToken !== token) return;
            set({ profile, isLoading: false, isInitialized: true });
          },
          (error) => {
            if (get()._profileLoadToken !== token) return;
            logger.error('Profile subscription error', error, 'AuthStore');
            set({ isLoading: false, isInitialized: true, error: 'Failed to load profile data' });
          }
        );
        set({ _profileUnsubscribe: profileUnsubscribe });
      } else {
        const newToken = get()._profileLoadToken + 1;
        set({ _profileLoadToken: newToken });

        get()._profileUnsubscribe?.();
        set({
          _profileUnsubscribe: null,
          user: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
      }
    });

    set({ _authUnsubscribe: authUnsubscribe });

    const currentUser = getCurrentUser();
    if (!currentUser) {
      set({ isInitialized: true, isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const user = await signIn(email, password);
      const token = get()._profileLoadToken + 1;
      set({ _profileLoadToken: token });
      const profile = await getProfileWithTimeout();
      if (get()._profileLoadToken === token) {
        set({ user, profile, isAuthenticated: true, isInitialized: true, isLoading: false, error: null });
      }
    } catch (error) {
      logger.warn('Login failed', error, 'AuthStore');
      let message = 'Login failed. Please try again.';
      if (error instanceof Error) {
        const e = error.message.toLowerCase();
        if (e.includes('auth/invalid-credential') || e.includes('auth/user-not-found') || e.includes('auth/wrong-password')) {
          message = 'Incorrect email or password.';
        } else if (e.includes('auth/invalid-email')) {
          message = 'Please enter a valid email address.';
        } else if (e.includes('auth/too-many-requests')) {
          message = 'Too many failed attempts. Try again later.';
        } else {
          message = error.message;
        }
      }
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (email, password, displayName) => {
    try {
      set({ isLoading: true, error: null });
      const user = await signUp(email, password, displayName);
      const token = get()._profileLoadToken + 1;
      set({ _profileLoadToken: token });
      const profile = await getProfileWithTimeout();
      if (get()._profileLoadToken === token) {
        set({ user, profile, isAuthenticated: true, isInitialized: true, isLoading: false, error: null });
      }
    } catch (error) {
      logger.warn('Registration failed', error, 'AuthStore');
      let message = 'Registration failed. Please try again.';
      if (error instanceof Error) {
        const e = error.message.toLowerCase();
        if (e.includes('auth/email-already-in-use')) message = 'This email is already in use.';
        else if (e.includes('auth/weak-password')) message = 'Password is too weak.';
        else if (e.includes('auth/invalid-email')) message = 'Please enter a valid email address.';
        else message = error.message;
      }
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  requestPasswordReset: async (email) => {
    try {
      set({ isLoading: true, error: null });
      await resetPassword(email);
      set({ isLoading: false });
    } catch (error) {
      logger.warn('Password reset failed', error, 'AuthStore');
      let message = 'Could not send reset email. Please try again.';
      if (error instanceof Error) {
        const e = error.message.toLowerCase();
        if (e.includes('auth/invalid-email')) message = 'Please enter a valid email address.';
        else if (e.includes('auth/user-not-found')) message = 'No account found for this email.';
        else if (e.includes('auth/too-many-requests')) message = 'Too many reset attempts. Try again later.';
        else message = error.message;
      }
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      get()._profileUnsubscribe?.();
      set({ _profileUnsubscribe: null });
      await signOut();
    } catch (error) {
      logger.error('Logout failed', error, 'AuthStore');
      // Force local logout even if Firebase signOut fails
      set({ user: null, profile: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  completeOnboarding: async (data) => {
    try {
      set({ isLoading: true, error: null });
      await completeOnboardingData(data);
      set((state) => ({
        profile: state.profile
          ? { ...state.profile, ...data, onboardingCompleted: true }
          : {
              email: state.user?.email ?? '',
              displayName: state.user?.displayName ?? 'Commander',
              createdAt: Timestamp.now(),
              ...data,
              currentScores: { discipline: 50, productivity: 50, consistency: 50 },
              onboardingCompleted: true,
            },
        isLoading: false,
      }));
    } catch (error) {
      logger.error('Complete onboarding failed', error, 'AuthStore');
      const message = error instanceof Error ? error.message : 'Failed to complete onboarding';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateProfile: async (data) => {
    try {
      set({ isLoading: true, error: null });
      await updateProfileData(data);
      set((state) => ({
        profile: state.profile ? { ...state.profile, ...data } : state.profile,
        isLoading: false,
      }));
    } catch (error) {
      logger.error('Update profile failed', error, 'AuthStore');
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  refreshProfile: async () => {
    try {
      const profile = await getProfile();
      set({ profile });
    } catch (error) {
      // Non-critical: real-time subscription is the source of truth
      logger.warn('Profile refresh failed', error, 'AuthStore');
    }
  },

  clearError: () => set({ error: null }),

  _cleanup: () => {
    const { _authUnsubscribe, _profileUnsubscribe, _profileLoadToken } = get();
    _authUnsubscribe?.();
    _profileUnsubscribe?.();
    set({
      _authUnsubscribe: null,
      _profileUnsubscribe: null,
      _profileLoadToken: _profileLoadToken + 1,
    });
  },
}));

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectIsOnboardingRequired = (state: AuthState): boolean =>
  state.isAuthenticated && state.profile !== null && !state.profile.onboardingCompleted;

export const selectDisciplineLevel = (state: AuthState) =>
  state.profile?.disciplineLevel ?? 'strict';

export const selectCurrentScores = (state: AuthState) =>
  state.profile?.currentScores ?? { discipline: 50, productivity: 50, consistency: 50 };

export const cleanupAuth = (): void => {
  useAuthStore.getState()._cleanup();
};