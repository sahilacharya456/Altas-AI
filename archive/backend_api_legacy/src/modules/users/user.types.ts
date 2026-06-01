import { Types, Document } from 'mongoose';
import { DisciplineLevel } from '../../config/openai.js';

export interface LifeRhythm {
  wakeTime: string;      // "06:00"
  sleepTime: string;     // "22:00"
  workStartTime: string; // "09:00"
  workEndTime: string;   // "17:00"
  timezone: string;      // "Asia/Kolkata"
}

export interface UserPreferences {
  notificationsEnabled: boolean;
  mentorTone: DisciplineLevel;
  reminderFrequency: 'low' | 'medium' | 'high';
  focusAreas: string[];
}

export interface UserScores {
  discipline: number;    // 0-100
  productivity: number;  // 0-100
  consistency: number;
  health: number;
  digital: number;
  lastUpdated: Date;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  displayName: string;
  profileImage?: string;

  // Onboarding data
  disciplineLevel: DisciplineLevel;
  focusAreas: ('career' | 'health' | 'fitness' | 'study' | 'personal')[];
  lifeRhythm: LifeRhythm;

  // Preferences
  preferences: UserPreferences;

  // Scores (denormalized for quick access)
  currentScores: UserScores;

  // Onboarding status
  onboardingCompleted: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  displayName: string;
}

export interface UpdateUserDTO {
  displayName?: string;
  profileImage?: string;
  disciplineLevel?: DisciplineLevel;
  focusAreas?: ('career' | 'health' | 'fitness' | 'study' | 'personal')[];
  lifeRhythm?: Partial<LifeRhythm>;
  preferences?: Partial<UserPreferences>;
}

export interface OnboardingDTO {
  disciplineLevel: DisciplineLevel;
  focusAreas: ('career' | 'health' | 'fitness' | 'study' | 'personal')[];
  lifeRhythm: LifeRhythm;
}

export interface UserPublic {
  id: string;
  email: string;
  displayName: string;
  profileImage?: string;
  disciplineLevel: DisciplineLevel;
  focusAreas: string[];
  lifeRhythm: LifeRhythm;
  preferences: UserPreferences;
  currentScores: UserScores;
  onboardingCompleted: boolean;
  createdAt: Date;
}
