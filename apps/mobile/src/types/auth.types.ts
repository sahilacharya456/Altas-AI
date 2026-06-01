import type { DisciplineLevel, FocusArea, ReminderFrequency } from '../constants/discipline';

export interface LifeRhythm {
  wakeTime: string;
  sleepTime: string;
  workStartTime: string;
  workEndTime: string;
  timezone: string;
}

export interface UserPreferences {
  notificationsEnabled: boolean;
  mentorTone: DisciplineLevel;
  reminderFrequency: ReminderFrequency;
  focusAreas: FocusArea[];
}

export interface UserScores {
  discipline: number;
  consistency: number;
  health: number;
  digital: number;
  lastUpdated: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  profileImage?: string;
  disciplineLevel: DisciplineLevel;
  focusAreas: FocusArea[];
  lifeRhythm: LifeRhythm;
  preferences: UserPreferences;
  currentScores: UserScores;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface OnboardingRequest {
  disciplineLevel: DisciplineLevel;
  focusAreas: FocusArea[];
  lifeRhythm: LifeRhythm;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    disciplineLevel: DisciplineLevel;
    onboardingCompleted: boolean;
  };
  tokens: AuthTokens;
}
