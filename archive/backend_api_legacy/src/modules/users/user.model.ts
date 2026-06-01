import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from './user.types.js';

const lifeRhythmSchema = new Schema(
  {
    wakeTime: { type: String, default: '06:00' },
    sleepTime: { type: String, default: '22:00' },
    workStartTime: { type: String, default: '09:00' },
    workEndTime: { type: String, default: '17:00' },
    timezone: { type: String, default: 'UTC' },
  },
  { _id: false }
);

const preferencesSchema = new Schema(
  {
    notificationsEnabled: { type: Boolean, default: true },
    mentorTone: {
      type: String,
      enum: ['mentor', 'strict', 'ruthless'],
      default: 'strict',
    },
    reminderFrequency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    focusAreas: [{ type: String }],
  },
  { _id: false }
);

const scoresSchema = new Schema(
  {
    discipline: { type: Number, default: 50, min: 0, max: 100 },
    productivity: { type: Number, default: 50, min: 0, max: 100 },
    consistency: { type: Number, default: 50, min: 0, max: 100 },
    health: { type: Number, default: 50, min: 0, max: 100 },
    digital: { type: Number, default: 50, min: 0, max: 100 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      minlength: [2, 'Display name must be at least 2 characters'],
      maxlength: [50, 'Display name cannot exceed 50 characters'],
    },
    profileImage: {
      type: String,
    },

    // Onboarding data
    disciplineLevel: {
      type: String,
      enum: ['mentor', 'strict', 'ruthless'],
      default: 'strict',
    },
    focusAreas: [{
      type: String,
      enum: ['career', 'health', 'fitness', 'study', 'personal'],
    }],
    lifeRhythm: {
      type: lifeRhythmSchema,
      default: () => ({}),
    },

    // Preferences
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },

    // Scores
    currentScores: {
      type: scoresSchema,
      default: () => ({}),
    },

    // Onboarding status
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },

    // Activity tracking
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        obj.id = obj._id;
        delete obj._id;
        delete obj.__v;
        delete obj.password;
        return obj;
      },
    },
  }
);

// Index for common queries
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'currentScores.discipline': -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Update lastActiveAt on every save
userSchema.pre('save', function (next) {
  this.lastActiveAt = new Date();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
