import apiClient, { extractData } from './client';
import { API_ENDPOINTS } from '../../constants/api';

// Types
export type ConversationContextType = 'general' | 'task_review' | 'goal_planning' | 'reflection' | 'morning' | 'crisis';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    context?: string;
}

export interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    contextType: ConversationContextType;
    isActive: boolean;
    lastMessageAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationPreview {
    id: string;
    title: string;
    contextType: ConversationContextType;
    lastMessageAt: string;
    createdAt: string;
}

export interface ChatInput {
    message: string;
    conversationId?: string;
    contextType?: ConversationContextType;
}

export interface ChatResponse {
    response: string;
    conversationId: string;
}

// API Functions
export const mentorApi = {
    // Send message to mentor
    chat: async (input: ChatInput): Promise<ChatResponse> => {
        const response = await apiClient.post(API_ENDPOINTS.MENTOR.CHAT, input);
        return extractData(response);
    },

    // List conversations
    listConversations: async (limit = 20): Promise<ConversationPreview[]> => {
        const response = await apiClient.get(`${API_ENDPOINTS.MENTOR.CONVERSATIONS}?limit=${limit}`);
        return extractData(response);
    },

    // Get conversation by ID
    getConversation: async (id: string): Promise<Conversation> => {
        const response = await apiClient.get(API_ENDPOINTS.MENTOR.CONVERSATION(id));
        return extractData(response);
    },

    // Delete conversation
    deleteConversation: async (id: string): Promise<void> => {
        await apiClient.delete(API_ENDPOINTS.MENTOR.CONVERSATION(id));
    },
};
