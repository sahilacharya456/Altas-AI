import mongoose, { Schema, Model, Types, Document } from 'mongoose';

export interface IMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    context?: string; // What context was used for this response
}

export interface IConversation extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    title: string;
    messages: IMessage[];
    contextType: 'general' | 'task_review' | 'goal_planning' | 'reflection' | 'morning' | 'crisis';
    isActive: boolean;
    lastMessageAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true,
        },
        content: {
            type: String,
            required: true,
            maxlength: 4000,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        context: {
            type: String,
        },
    },
    { _id: false }
);

const conversationSchema = new Schema<IConversation>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            default: 'New Conversation',
            maxlength: 100,
        },
        messages: [messageSchema],
        contextType: {
            type: String,
            enum: ['general', 'task_review', 'goal_planning', 'reflection', 'morning', 'crisis'],
            default: 'general',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
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

// Indexes
conversationSchema.index({ userId: 1, isActive: 1 });
conversationSchema.index({ userId: 1, lastMessageAt: -1 });

// Auto-generate title from first user message if not set
conversationSchema.pre('save', function (next: () => void) {
    if (this.isNew && this.messages.length > 0 && this.title === 'New Conversation') {
        const firstUserMessage = this.messages.find((m: IMessage) => m.role === 'user');
        if (firstUserMessage) {
            // Truncate and clean the first message for title
            this.title = firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '');
        }
    }
    next();
});

export const Conversation: Model<IConversation> = mongoose.model<IConversation>('Conversation', conversationSchema);
