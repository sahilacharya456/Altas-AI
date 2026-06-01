import apiClient, { extractData, tokenManager } from './client';
import { API_ENDPOINTS } from '../../constants/api';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  OnboardingRequest,
  User,
} from '../../types/auth.types';

export const authApi = {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, data);
    const result = extractData<AuthResponse>(response);

    // Store tokens
    await tokenManager.setTokens(result.tokens.accessToken, result.tokens.refreshToken);

    return result;
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, data);
    const result = extractData<AuthResponse>(response);

    // Store tokens
    await tokenManager.setTokens(result.tokens.accessToken, result.tokens.refreshToken);

    return result;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      await tokenManager.clearTokens();
    }
  },

  async getProfile(): Promise<User> {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.PROFILE);
    return extractData<User>(response);
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.patch(API_ENDPOINTS.AUTH.PROFILE, data);
    return extractData<User>(response);
  },

  async completeOnboarding(data: OnboardingRequest): Promise<User> {
    const response = await apiClient.post(API_ENDPOINTS.AUTH.ONBOARDING, data);
    return extractData<User>(response);
  },

  async refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = await tokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
    const result = extractData<{ accessToken: string; refreshToken: string }>(response);

    await tokenManager.setTokens(result.accessToken, result.refreshToken);

    return result;
  },
};
