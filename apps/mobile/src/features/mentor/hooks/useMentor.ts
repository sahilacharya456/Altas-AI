import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';

import { DISCIPLINE_LEVELS } from '../../../constants/discipline';
import { trackProductEvent } from '../../../services/analytics/productEvents';
import { useAuthStore } from '../../../stores/authStore';
import { safeImpactAsync, safeSelectionAsync, ImpactFeedbackStyle } from '../../../utils/haptics';
import { chatWithMentor } from '../services/mentorService';
import type { MentorMessage } from '../types';

export const mentorQuickResponses = [
  'Plan my next 3 hours',
  'Audit my excuses',
  'Review my progress',
  'Give me one hard action',
];

export const useMentor = () => {
  const { user, profile } = useAuthStore();
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [isAITyping, setIsAITyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const disciplineConfig = profile?.disciplineLevel
    ? DISCIPLINE_LEVELS[profile.disciplineLevel]
    : DISCIPLINE_LEVELS.strict;
  const isOfflineFallback = messages.some((msg) => msg.role === 'assistant' && msg.offline);

  useEffect(() => {
    if (messages.length > 0) return;

    const name = user?.displayName?.split(' ')[0] || 'User';
    setMessages([{
      id: 'init',
      role: 'assistant',
      content: `Ready, ${name}. Give me the real situation and I will turn it into the next move.`,
      timestamp: new Date(),
    }]);
  }, [messages.length, user?.displayName]);

  useEffect(() => {
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 90);

    return () => clearTimeout(timer);
  }, [messages, isAITyping]);

  const handleSend = useCallback(async () => {
    if (!message.trim() || isAITyping) return;

    safeImpactAsync(ImpactFeedbackStyle.Medium);

    const userMsgText = message.trim();
    trackProductEvent('mentor_prompt_submitted', {
      userId: user?.uid,
      metadata: { promptLength: userMsgText.length },
    });

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMsgText,
      timestamp: new Date(),
    }]);
    setMessage('');
    setIsAITyping(true);

    try {
      const response = await chatWithMentor(userMsgText, conversationId, 'general');

      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      trackProductEvent(response.offline ? 'mentor_fallback_used' : 'mentor_response_received', {
        userId: user?.uid,
        metadata: {
          offline: Boolean(response.offline),
          responseLength: response.response.length,
        },
      });

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        offline: response.offline,
      }]);
    } catch (error) {
      if (__DEV__) console.error('[Mentor] AI Chat Error:', error);
      const err = error as { code?: string; message?: string };
      const errorLabel = [err.code, err.message].filter(Boolean).join(': ');
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorLabel
          ? `Connection failed: ${errorLabel}`
          : 'Connection failed. Check the AltasAI backend API.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsAITyping(false);
    }
  }, [message, isAITyping, user?.uid, conversationId]);

  const handleQuickResponse = useCallback((response: string) => {
    safeSelectionAsync();
    setMessage(response);
  }, []);

  return {
    message,
    setMessage,
    messages,
    isAITyping,
    scrollViewRef,
    disciplineConfig,
    isOfflineFallback,
    handleSend,
    handleQuickResponse,
  };
};
