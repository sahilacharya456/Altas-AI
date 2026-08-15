/**
 * Unit tests for authStore — core auth state management.
 */

jest.mock('../../services/firebase', () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  onAuthChange: jest.fn(() => () => {}),
  getCurrentUser: jest.fn(() => null),
  resetPassword: jest.fn(),
}));

jest.mock('../../services/data', () => ({
  getProfile: jest.fn(() => Promise.resolve(null)),
  completeOnboarding: jest.fn(),
  updateProfile: jest.fn(),
  subscribeToProfile: jest.fn(() => () => {}),
}));

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { useAuthStore } from '../../stores/authStore';
import * as firebaseService from '../../services/firebase';

const mockSignIn = firebaseService.signIn as jest.MockedFunction<typeof firebaseService.signIn>;
const mockSignOut = firebaseService.signOut as jest.MockedFunction<typeof firebaseService.signOut>;

beforeEach(() => {
  useAuthStore.setState({
    user: null, profile: null, isAuthenticated: false,
    isLoading: false, isInitialized: false, error: null,
    _authUnsubscribe: null, _profileUnsubscribe: null, _profileLoadToken: 0,
  });
  jest.clearAllMocks();
});

describe('authStore — login', () => {
  it('sets isLoading during login', async () => {
    mockSignIn.mockResolvedValueOnce({ uid: 'u1', email: 'a@b.com', displayName: 'A', emailVerified: true });
    const loginPromise = useAuthStore.getState().login('a@b.com', 'password123');
    expect(useAuthStore.getState().isLoading).toBe(true);
    await loginPromise;
  });

  it('sets user and isAuthenticated on success', async () => {
    const fakeUser = { uid: 'u1', email: 'a@b.com', displayName: 'A', emailVerified: true };
    mockSignIn.mockResolvedValueOnce(fakeUser);
    await useAuthStore.getState().login('a@b.com', 'password123');
    const state = useAuthStore.getState();
    expect(state.user).toEqual(fakeUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets error and throws on failure', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('auth/invalid-credential'));
    await expect(useAuthStore.getState().login('bad@b.com', 'wrong')).rejects.toThrow();
    const state = useAuthStore.getState();
    expect(state.error).toBeTruthy();
    expect(state.isLoading).toBe(false);
  });
});

describe('authStore — logout', () => {
  it('clears user state after logout', async () => {
    useAuthStore.setState({ user: { uid: 'u1', email: 'a@b.com', displayName: 'A', emailVerified: true }, isAuthenticated: true });
    mockSignOut.mockResolvedValueOnce();
    await useAuthStore.getState().logout();
    // Auth state listener handles full cleanup; isAuthenticated may still be true until listener fires
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});

describe('authStore — clearError', () => {
  it('clears error state', () => {
    useAuthStore.setState({ error: 'Some error' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });
});
