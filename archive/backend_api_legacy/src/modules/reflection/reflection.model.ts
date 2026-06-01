import mongoose, { Schema, Model, Types, Document } from 'mongoose';

export interface IReflection extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    date: Date;

    // Core reflection data
    mood: 1 | 2 | 3 | 4 | 5; // 1 = terrible, 5 = excellent
    energyLevel: 1 | 2 | 3 | 4 | 5;

    // What went well/poorly
    wins: string[];
    struggles: string[];

    // Self-assessment
    honestAssessment: string; // Free-form honest reflection
    excusesMade: string[]; // Acknowledge excuses

    // Tomorrow's commitment
    tomorrowPriority: string; // One main thing to focus on
    tomorrowCommitmentTime: string; // When will they start?

    // Scores for the day
    productivityScore: number; // 0-100
    disciplineScore: number; // 0-100

    // Task summary (auto-populated)
    tasksCompleted: number;
    tasksMissed: number;
    tasksCarried: number;
    focusMinutes: number;

    // AI feedback (populated after submission)
    mentorFeedback?: string;

    createdAt: Date;
    updatedAt: Date;
}

const reflectionSchema = new Schema<IReflection>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        date: {
            type: Date,
            required: true,
        },
        mood: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        energyLevel: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        wins: [{
            type: String,
            maxlength: 200,
        }],
        struggles: [{
            type: String,
            maxlength: 200,
        }],
        honestAssessment: {
            type: String,
            required: true,
            maxlength: 1000,
        },
        excusesMade: [{
            type: String,
            maxlength: 200,
        }],
        tomorrowPriority: {
            type: String,
            required: true,
            maxlength: 200,
        },
        tomorrowCommitmentTime: {
            type: String,
            match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'],
        },
        productivityScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 50,
        },
        disciplineScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 50,
        },
        tasksCompleted: {
            type: Number,
            default: 0,
        },
        tasksMissed: {
            type: Number,
            default: 0,
        },
        tasksCarried: {
            type: Number,
            default: 0,
        },
        focusMinutes: {
            type: Number,
            default: 0,
        },
        mentorFeedback: {
            type: String,
            maxlength: 500,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform(_doc: unknown, ret: Record<string, unknown>) {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Unique constraint: one reflection per user per day
reflectionSchema.index({ userId: 1, date: 1 }, { unique: true });
reflectionSchema.index({ userId: 1, createdAt: -1 });

export const Reflection: Model<IReflection> = mongoose.model<IReflection>('Reflection', reflectionSchema);
