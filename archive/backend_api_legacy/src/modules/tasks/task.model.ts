import mongoose, { Schema, Model, Types, Document } from 'mongoose';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'carried' | 'cancelled';
export type TaskCategory = 'career' | 'health' | 'fitness' | 'study' | 'personal' | 'routine';

export interface ITask extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    title: string;
    description?: string;
    category: TaskCategory;
    priority: TaskPriority;
    status: TaskStatus;

    // Scheduling
    scheduledDate: Date;
    dueTime?: string; // "HH:MM" format
    estimatedMinutes: number;
    actualMinutes?: number;

    // Completion
    completedAt?: Date;

    // Carry system
    isCarried: boolean;
    carryCount: number;
    originalDate?: Date;
    carriedFrom?: Types.ObjectId; // Reference to original task

    // Metadata
    tags: string[];
    goalId?: Types.ObjectId; // Link to parent goal

    // AI-generated
    isAIGenerated: boolean;
    parentTaskId?: Types.ObjectId; // For subtasks

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Task title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        category: {
            type: String,
            enum: ['career', 'health', 'fitness', 'study', 'personal', 'routine'],
            default: 'personal',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
            default: 'medium',
        },
        status: {
            type: String,
            enum: ['pending', 'in_progress', 'completed', 'carried', 'cancelled'],
            default: 'pending',
        },
        scheduledDate: {
            type: Date,
            required: [true, 'Scheduled date is required'],
            index: true,
        },
        dueTime: {
            type: String,
            match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'],
        },
        estimatedMinutes: {
            type: Number,
            default: 30,
            min: [5, 'Minimum 5 minutes'],
            max: [480, 'Maximum 8 hours'],
        },
        actualMinutes: {
            type: Number,
            min: 0,
        },
        completedAt: {
            type: Date,
        },
        isCarried: {
            type: Boolean,
            default: false,
        },
        carryCount: {
            type: Number,
            default: 0,
            max: [3, 'Task can only be carried 3 times'],
        },
        originalDate: {
            type: Date,
        },
        carriedFrom: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
        },
        tags: [{
            type: String,
            trim: true,
            lowercase: true,
        }],
        goalId: {
            type: Schema.Types.ObjectId,
            ref: 'Goal',
        },
        isAIGenerated: {
            type: Boolean,
            default: false,
        },
        parentTaskId: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
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
                return obj;
            },
        },
    }
);

// Compound indexes for common queries
taskSchema.index({ userId: 1, scheduledDate: 1 });
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, category: 1 });
taskSchema.index({ userId: 1, goalId: 1 });

// Pre-save: Set originalDate when task is first created
taskSchema.pre('save', function (next) {
    if (this.isNew && !this.originalDate) {
        this.originalDate = this.scheduledDate;
    }
    next();
});

export const Task: Model<ITask> = mongoose.model<ITask>('Task', taskSchema);
