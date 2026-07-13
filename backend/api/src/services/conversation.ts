import { db } from '../lib/firebaseAdmin';
import { logger } from '../utils/logger';
import type { ConversationTurn } from '../altasai/core/types';

const MAX_HISTORY_TURNS = 6; // 3 user + 3 assistant = enough context without blowing token budget

export const retrieveConversationHistory = async (
  userId: string,
  conversationId: string,
): Promise<ConversationTurn[]> => {
  if (!conversationId || conversationId.startsWith('offline-') || conversationId.startsWith('local_')) {
    return [];
  }

  try {
    const snap = await db.doc(`users/${userId}/conversations/${conversationId}`).get();
    if (!snap.exists) return [];

    const data = snap.data();
    const messages = Array.isArray(data?.messages) ? data.messages : [];

    // Take last MAX_HISTORY_TURNS messages, exclude current (not yet written)
    return messages
      .filter((m: Record<string, unknown>) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' && m.content.length > 0
      )
      .slice(-MAX_HISTORY_TURNS)
      .map((m: Record<string, unknown>) => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content).slice(0, 800), // cap each turn to keep prompt size bounded
      }));
  } catch (error) {
    logger.warn('conversation.history_fetch_failed', {
      userId,
      conversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};
