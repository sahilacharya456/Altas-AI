/**
 * Auth Store - Firebase Version
 * Zustand store for authentication state using Firebase Auth
 */

import { create } from 'zustand';
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

interface AuthState {
  // State
  user: AuthUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
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
}

// Store for unsubscribe functions
let authUnsubscribe: (() => void) | null = null;
let profileUnsubscribe: (() => void) | null = null;
let profileLoadToken = 0;

const PROFILE_READ_TIMEOUT_MS = 4500;

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
    if (timeout) {
      clearTimeout(timeout);
    }
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  // Initialize auth state on app start
  initialize: async () => {
    // Guard against multiple initializations (hot reload, re-mount)
    if (authUnsubscribe) {
      return;
    }

    set({ isLoading: true, error: null });

    // Subscribe to auth state changes
    authUnsubscribe = onAuthChange(async (user) => {
      if (user) {
        const token = ++profileLoadToken;

        // User signed in - subscribe to profile
        set({
          user,
          isAuthenticated: true,
          isLoading: true,
        });

        // Clean up previous profile subscription if any
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = null;
        }

        void getProfileWithTimeout()
          .then((profile) => {
            if (token !== profileLoadToken) return;

            set({
              profile,
              isLoading: false,
              isInitialized: true,
            });
          })
          .catch((error) => {
            if (token !== profileLoadToken) return;

            console.error('[AuthStore] Profile load error:', error);
            set({
              profile: null,
              isLoading: false,
              isInitialized: true,
              error: null,
            });
          });

        // Subscribe to profile for real-time updates
        profileUnsubscribe = subscribeToProfile(
          (profile) => {
            if (token !== profileLoadToken) return;

            set({
              profile,
              isLoading: false,
              isInitialized: true,
            });
          },
          (error) => {
            if (token !== profileLoadToken) return;

            console.error('[AuthStore] Profile load error:', error);
            set({
              isLoading: false,
              isInitialized: true,
              error: 'Failed to load profile data',
            });
          }
        );
      } else {
        profileLoadToken++;

        // User signed out - cleanup subscriptions
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = null;
        }

        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
          isInitialized: true,
        });
      }
    });

    // Check current user immediately
    const currentUser = getCurrentUser();
    if (!currentUser) {
      set({
        isInitialized: true,
        isLoading: false,
      });
    }
  },

  // Login with email and password
  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      await signIn(email, password);
      // Auth state listener will handle the rest
    } catch (error) {
      let message = 'Login failed. Please try again.';
      if (error instanceof Error) {
        const errStr = error.message.toLowerCase();
        if (errStr.includes('auth/invalid-credential') || errStr.includes('auth/user-not-found') || errStr.includes('auth/wrong-password')) {
          message = 'Incorrect email or password. Please check your credentials and try again.';
        } else if (errStr.includes('auth/invalid-email')) {
          message = 'Please enter a valid email address.';
        } else if (errStr.includes('auth/too-many-requests')) {
          message = 'Too many failed attempts. Please try again later.';
        } else {
          message = error.message;
        }
      }
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Register new user
  register: async (email: string, password: string, displayName: string) => {
    try {
      set({ isLoading: true, error: null });
      await signUp(email, password, displayName);
      // Auth state listener will handle the rest
    } catch (error) {
      let message = 'Registration failed. Please try again.';
      if (error instanceof Error) {
        const errStr = error.message.toLowerCase();
        if (errStr.includes('auth/email-already-in-use')) {
          message = 'This email is already in use. Please log in instead.';
        } else if (errStr.includes('auth/weak-password')) {
          message = 'Password is too weak. Please use a stronger password.';
        } else if (errStr.includes('auth/invalid-email')) {
          message = 'Please enter a valid email address.';
        } else {
          message = error.message;
        }
      }
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Send password reset email
  requestPasswordReset: async (email: string) => {
    try {
      set({ isLoading: true, error: null });
      await resetPassword(email);
      set({ isLoading: false });
    } catch (error) {
      let message = 'Could not send reset email. Please try again.';
      if (error instanceof Error) {
        const errStr = error.message.toLowerCase();
        if (errStr.includes('auth/invalid-email')) {
          message = 'Please enter a valid email address first.';
        } else if (errStr.includes('auth/user-not-found')) {
          message = 'No account was found for this email address.';
        } else if (errStr.includes('auth/too-many-requests')) {
          message = 'Too many reset attempts. Please try again later.';
        } else {
          message = error.message;
        }
      }
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      set({ isLoading: true });

      // Cleanup subscriptions
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      await signOut();
      // Auth state listener will handle the rest
    } catch (error) {
      // Continue with logout even if API call fails
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // Complete onboarding
  completeOnboarding: async (data) => {
    try {
      set({ isLoading: true, error: null });
      await completeOnboardingData(data);
      // Profile subscription will update the state
      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete onboarding';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Update profile
  updateProfile: async (data) => {
    try {
      set({ isLoading: true, error: null });
      await updateProfileData(data);
      // Profile subscription will update the state
      set({ isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  // Refresh profile manually
  refreshProfile: async () => {
    try {
      const profile = await getProfile();
      set({ profile });
    } catch (error) {
      // Silent fail — profile subscription is the primary source
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

// Selectors for common derived state
export const selectIsOnboardingRequired = (state: AuthState): boolean =>
  state.isAuthenticated && state.profile !== null && !state.profile.onboardingCompleted;

export const selectDisciplineLevel = (state: AuthState) =>
  state.profile?.disciplineLevel ?? 'strict';

export const selectCurrentScores = (state: AuthState) =>
  state.profile?.currentScores ?? { discipline: 50, productivity: 50, consistency: 50 };

// Cleanup function for app unmount
export const cleanupAuth = () => {
  profileLoadToken++;
  if (authUnsubscribe) {
    authUnsubscribe();
    authUnsubscribe = null;
  }
  if (profileUnsubscribe) {
    profileUnsubscribe();
    profileUnsubscribe = null;
  }
};
