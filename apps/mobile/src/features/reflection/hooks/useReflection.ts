import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useAnalyticsStore } from '../../../stores/analyticsStore';
import { useAuthStore } from '../../../stores/authStore';
import { safeImpactAsync, safeNotificationAsync, ImpactFeedbackStyle, NotificationFeedbackType } from '../../../utils/haptics';
import { reflectionSteps } from '../constants';
import { generateReflectionFeedback, submitDailyLog } from '../services/reflectionService';
import type { ReflectionStep } from '../types';

const getDateId = (date: Date): string => date.toISOString().split('T')[0];

export function useReflection() {
  const [currentStep, setCurrentStep] = useState<ReflectionStep>('intro');
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [wins, setWins] = useState('');
  const [challenges, setChallenges] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');

  const { dashboard } = useAnalyticsStore();
  const { user } = useAuthStore();

  const daySummary = useMemo(() => ({
    tasksCompleted: dashboard?.today.tasksCompleted || 0,
    totalTasks: (dashboard?.today.tasksCompleted || 0) + (dashboard?.today.tasksPending || 0),
    focusMinutes: dashboard?.today.focusMinutes || 0,
    screenTime: 0,
  }), [dashboard?.today.focusMinutes, dashboard?.today.tasksCompleted, dashboard?.today.tasksPending]);

  const progress = useSharedValue(0);
  const currentIndex = reflectionSteps.indexOf(currentStep);

  useEffect(() => {
    progress.value = withTiming(currentIndex / (reflectionSteps.length - 1), {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentIndex, progress]);

  const generateInsight = useCallback(async () => {
    if (mood === null || energy === null || !user) return;

    setIsGeneratingInsight(true);
    try {
      await submitDailyLog(user.uid, {
        mood: mood as 1 | 2 | 3 | 4 | 5,
        energyLevel: energy as 1 | 2 | 3 | 4 | 5,
        wins: wins ? [wins] : [],
        struggles: challenges ? [challenges] : [],
        honestAssessment: gratitude,
        tomorrowPriority: '',
        productivityScore: dashboard?.scores.productivity || 50,
        tasksCompleted: daySummary.tasksCompleted,
        tasksMissed: 0,
        tasksCarried: 0,
        focusMinutes: daySummary.focusMinutes,
      });

      const feedback = await generateReflectionFeedback(getDateId(new Date()));
      setAiInsight(feedback);
    } catch (error) {
      if (__DEV__) console.error('[Reflection] Error:', error);
      setAiInsight('Reflection saved locally. AltasAI could not generate mentor feedback right now.');
    } finally {
      setIsGeneratingInsight(false);
    }
  }, [
    challenges,
    dashboard?.scores.productivity,
    daySummary.focusMinutes,
    daySummary.tasksCompleted,
    energy,
    gratitude,
    mood,
    user,
    wins,
  ]);

  useEffect(() => {
    if (currentStep === 'summary' && !aiInsight && !isGeneratingInsight) {
      generateInsight();
    }
  }, [aiInsight, currentStep, generateInsight, isGeneratingInsight]);

  const handleNext = useCallback(() => {
    safeImpactAsync(ImpactFeedbackStyle.Light);
    const nextIndex = currentIndex + 1;
    if (nextIndex < reflectionSteps.length) {
      setCurrentStep(reflectionSteps[nextIndex]);
    }
  }, [currentIndex]);

  const handleBack = useCallback(() => {
    safeImpactAsync(ImpactFeedbackStyle.Light);
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(reflectionSteps[prevIndex]);
    }
  }, [currentIndex]);

  const handleComplete = useCallback(() => {
    safeNotificationAsync(NotificationFeedbackType.Success);
    router.back();
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return {
    currentStep,
    currentIndex,
    steps: reflectionSteps,
    mood,
    setMood,
    energy,
    setEnergy,
    wins,
    setWins,
    challenges,
    setChallenges,
    gratitude,
    setGratitude,
    aiInsight,
    isGeneratingInsight,
    daySummary,
    progressStyle,
    handleNext,
    handleBack,
    handleComplete,
  };
}
