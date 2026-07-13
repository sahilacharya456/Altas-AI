import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DISCIPLINE_LEVELS } from '../../../constants/discipline';
import { trackProductEvent } from '../../../services/analytics/productEvents';
import { useAuthStore } from '../../../stores/authStore';
import { useGoalsStore } from '../../../stores/goalsStore';
import { useTasksStore } from '../../../stores/tasksStore';
import { useSubscriptionStore } from '../../../stores/subscriptionStore';
import { safeImpactAsync, safeSelectionAsync, ImpactFeedbackStyle } from '../../../utils/haptics';
import { chatWithMentor, recordMentorReward } from '../services/mentorService';
import type { MentorMessage } from '../types';

export const DEFAULT_QUICK_RESPONSES = [
  'Plan my next 3 hours',
  'Audit my excuses',
  'Review my progress',
  'Give me one hard action',
];

const AI_MEMORY_KEY = 'altasai.aiMemoryEnabled';
const CONVERSATION_ID_KEY = 'altasai.mentorConversationId';

const detectContextType = (
  hour: number
): 'morning' | 'reflection' | 'general' => {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 20 || hour < 5) return 'reflection';
  return 'general';
};

const detectAnalyzingLabel = (msg: string): string => {
  const lower = msg.toLowerCase();
  if (/\b(task|create|add|schedule)\b/.test(lower)) return 'Building your task...';
  if (/\b(plan|next|what should|priority)\b/.test(lower)) return 'Planning your next move...';
  if (/\b(reflect|how did|review|week|today)\b/.test(lower)) return 'Reviewing your execution...';
  if (/\b(focus|session|work|deep)\b/.test(lower)) return 'Optimizing your focus...';
  if (/\b(goal|progress|milestone)\b/.test(lower)) return 'Analyzing your goals...';
  return 'AltasAI is analyzing';
};

export const useMentor = () => {
  const { user, profile } = useAuthStore();
  const { summary: taskSummary, tasks } = useTasksStore();
  const { goals } = useGoalsStore();
  const { limits: tierLimits, fetch: fetchSubscription } = useSubscriptionStore();
  const [message, setMessage] = useState('');
  const [analyzingLabel, setAnalyzingLabel] = useState('AltasAI is analyzing');
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [isAITyping, setIsAITyping] = useState(false);
  const [aiMemoryEnabled, setAiMemoryEnabled] = useState(true);
  const [quickResponses, setQuickResponses] = useState<string[]>(DEFAULT_QUICK_RESPONSES);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const disciplineConfig = profile?.disciplineLevel
    ? DISCIPLINE_LEVELS[profile.disciplineLevel]
    : DISCIPLINE_LEVELS.strict;
  const isOfflineFallback = messages.some((msg) => msg.role === 'assistant' && msg.offline);

  const activeGoals = goals.filter((g) => g.status === 'active');
  const topGoal = activeGoals.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0))[0];

  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  useEffect(() => {
    void AsyncStorage.multiGet([AI_MEMORY_KEY, CONVERSATION_ID_KEY]).then((entries) => {
      const memoryValue = entries[0][1];
      const savedConvId = entries[1][1];
      if (memoryValue === 'false') setAiMemoryEnabled(false);
      if (savedConvId) setConversationId(savedConvId);
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0) return;

    const name = user?.displayName?.split(' ')[0] || 'User';
    const pending = taskSummary?.pending ?? 0;
    const completed = taskSummary?.completed ?? 0;
    const total = pending + completed;

    const taskLine = total > 0
      ? `You have ${pending} task${pending !== 1 ? 's' : ''} pending and ${completed} done today.`
      : '';

    const goalLine = topGoal
      ? `Your top goal "${topGoal.title}" is at ${topGoal.progress ?? 0}%.`
      : '';

    const intro = [
      `Ready, ${name}.`,
      taskLine,
      goalLine,
      taskLine || goalLine ? 'Give me the real situation.' : 'Give me the real situation and I will turn it into the next move.',
    ].filter(Boolean).join(' ');

    setMessages([{
      id: 'init',
      role: 'assistant',
      content: intro,
      timestamp: new Date(),
    }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  useEffect(() => {
    const timer: ReturnType<typeof setTimeout> = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 90);

    return () => clearTimeout(timer);
  }, [messages, isAITyping]);

  const buildClientContext = useCallback(() => {
    return {
      pendingTasks: taskSummary?.pending ?? 0,
      completedTasks: taskSummary?.completed ?? 0,
      completionRate: taskSummary?.completionRate ?? 0,
      activeGoalCount: activeGoals.length,
      topGoalTitle: topGoal?.title,
      topGoalProgress: topGoal?.progress ?? undefined,
      disciplineLevel: profile?.disciplineLevel as 'mentor' | 'strict' | 'ruthless' | undefined,
      focusAreas: profile?.focusAreas,
      currentScores: profile?.currentScores as { discipline: number; productivity: number; consistency: number } | undefined,
      lifeRhythm: profile?.lifeRhythm as { wakeTime?: string; sleepTime?: string; timezone?: string } | undefined,
    };
  }, [taskSummary, activeGoals.length, topGoal, profile]);

  const handleSend = useCallback(async () => {
    if (!message.trim() || isAITyping) return;

    safeImpactAsync(ImpactFeedbackStyle.Medium);

    const userMsgText = message.trim();
    const hour = new Date().getHours();
    const autoContextType = detectContextType(hour);
    const label = detectAnalyzingLabel(userMsgText);

    setAnalyzingLabel(label);

    trackProductEvent('mentor_prompt_submitted', {
      userId: user?.uid,
      metadata: { promptLength: userMsgText.length, contextType: autoContextType },
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
      if (!aiMemoryEnabled) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: [
            'AI memory is off, so this prompt was not sent to the backend conversation store.',
            '',
            `Next move: turn "${userMsgText}" into one concrete action and schedule it before opening another module.`,
          ].join('\n'),
          timestamp: new Date(),
          offline: true,
        }]);
        return;
      }

      const response = await chatWithMentor(
        userMsgText,
        conversationId,
        autoContextType,
        buildClientContext()
      );

      if (response.conversationId) {
        setConversationId(response.conversationId);
        void AsyncStorage.setItem(CONVERSATION_ID_KEY, response.conversationId);
      }

      trackProductEvent(response.offline ? 'mentor_fallback_used' : 'mentor_response_received', {
        userId: user?.uid,
        metadata: {
          offline: Boolean(response.offline),
          responseLength: response.response.length,
          contextType: autoContextType,
        },
      });

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        offline: response.offline,
        actions: response.actions,
      }]);

      if (response.nextActions?.length) {
        setQuickResponses(response.nextActions.slice(0, 4));
      }
    } catch (error) {
      if (__DEV__) console.error('[Mentor] AI Chat Error:', error);
      const err = error as { code?: string; message?: string; status?: number };

      // 429 quota exceeded: show upgrade prompt for free users.
      if (err.status === 429 || err.message?.includes('quota')) {
        setUpgradeReason(
          tierLimits.tier === 'free'
            ? `You've used your ${tierLimits.dailyMentorMessages} free messages today. Upgrade to Pro for 60/day.`
            : 'Daily quota reached. Try again tomorrow.'
        );
        setShowUpgradePrompt(tierLimits.tier === 'free');
        return;
      }

      if (err.status === 401) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Your session is not authenticated. Sign out, sign in again, then ask the mentor.',
          timestamp: new Date(),
        }]);
        return;
      }

      if (err.status === 403) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'The backend rejected this app request. Check Firebase App Check or backend security settings.',
          timestamp: new Date(),
        }]);
        return;
      }

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
  }, [message, isAITyping, user?.uid, conversationId, aiMemoryEnabled, buildClientContext, tierLimits.tier, tierLimits.dailyMentorMessages]);

  const handleQuickResponse = useCallback((response: string) => {
    safeSelectionAsync();
    setMessage(response);
    // Chip tap means the user acted on a recommendation.
    void recordMentorReward('mentor_plan', 0.8);
  }, []);

  return {
    message,
    setMessage,
    messages,
    isAITyping,
    analyzingLabel,
    scrollViewRef,
    disciplineConfig,
    isOfflineFallback,
    aiMemoryEnabled,
    quickResponses,
    taskSummary,
    tierLimits,
    showUpgradePrompt,
    upgradeReason,
    dismissUpgradePrompt: () => setShowUpgradePrompt(false),
    handleSend,
    handleQuickResponse,
  };
};
