import { User } from '../users/user.model.js';
import { IUser, OnboardingDTO } from '../users/user.types.js';
import { generateTokens, verifyRefreshToken } from '../../middleware/auth.middleware.js';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../../shared/errors/AppError.js';
import { RegisterDTO, LoginDTO, AuthResponse, TokenResponse } from './auth.types.js';

export class AuthService {
  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      throw ConflictError('An account with this email already exists');
    }

    // Create new user
    const user = await User.create({
      email: data.email.toLowerCase(),
      password: data.password,
      displayName: data.displayName,
    });

    // Generate tokens
    const tokens = generateTokens(
      user._id.toString(),
      user.email,
      user.disciplineLevel
    );

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        disciplineLevel: user.disciplineLevel,
        onboardingCompleted: user.onboardingCompleted,
      },
      tokens,
    };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    // Find user and include password for comparison
    const user = await User.findOne({ email: data.email.toLowerCase() }).select('+password');

    if (!user) {
      throw UnauthorizedError('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(data.password);
    if (!isPasswordValid) {
      throw UnauthorizedError('Invalid email or password');
    }

    // Update last active
    user.lastActiveAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokens(
      user._id.toString(),
      user.email,
      user.disciplineLevel
    );

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        disciplineLevel: user.disciplineLevel,
        onboardingCompleted: user.onboardingCompleted,
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw UnauthorizedError('User not found');
    }

    // Generate new tokens
    const tokens = generateTokens(
      user._id.toString(),
      user.email,
      user.disciplineLevel
    );

    return tokens;
  }

  async completeOnboarding(userId: string, data: OnboardingDTO): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw NotFoundError('User not found');
    }

    // Update user with onboarding data
    user.disciplineLevel = data.disciplineLevel;
    user.focusAreas = data.focusAreas;
    user.lifeRhythm = data.lifeRhythm;
    user.preferences.mentorTone = data.disciplineLevel;
    user.preferences.focusAreas = data.focusAreas;
    user.onboardingCompleted = true;

    await user.save();

    return user;
  }

  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw NotFoundError('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updates: Partial<IUser>): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw NotFoundError('User not found');
    }

    // Only allow updating specific fields
    const allowedUpdates = ['displayName', 'profileImage', 'preferences', 'lifeRhythm'];
    const updateKeys = Object.keys(updates);

    for (const key of updateKeys) {
      if (allowedUpdates.includes(key)) {
        (user as unknown as Record<string, unknown>)[key] = updates[key as keyof typeof updates];
      }
    }

    await user.save();
    return user;
  }
}

export const authService = new AuthService();
