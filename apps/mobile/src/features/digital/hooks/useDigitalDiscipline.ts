import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getTodaysUsage,
  getUnderGoalStreak,
  getUsageHistory,
  getWeeklyAverage,
  logDigitalUsage,
} from '../../../services/data';
import { useAuthStore } from '../../../stores/authStore';
import type { DigitalUsage } from '../../../types/firestore';
import {
  safeImpactAsync,
  safeNotificationAsync,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
} from '../../../utils/haptics';

export function useDigitalDiscipline() {
  const { user } = useAuthStore();
  const [screenMinutes, setScreenMinutes] = useState(0);
  const [goalMinutes, setGoalMinutes] = useState(240);
  const [notes, setNotes] = useState('');
  const [streak, setStreak] = useState(0);
  const [weeklyAvg, setWeeklyAvg] = useState(0);
  const [history, setHistory] = useState<DigitalUsage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const today = await getTodaysUsage(user.uid);
      if (today) {
        setScreenMinutes(today.screenMinutes);
        setGoalMinutes(today.goalMinutes);
        setNotes(today.notes || '');
        setIsSaved(true);
      }

      const [streakDays, average, weekHistory] = await Promise.all([
        getUnderGoalStreak(user.uid),
        getWeeklyAverage(user.uid),
        getUsageHistory(user.uid, 7),
      ]);

      setStreak(streakDays);
      setWeeklyAvg(average);
      setHistory(weekHistory);
    } catch {
      safeNotificationAsync(NotificationFeedbackType.Error);
    }
  }, [user?.uid]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSave = useCallback(async () => {
    if (!user?.uid) return;

    setIsLoading(true);
    safeImpactAsync(ImpactFeedbackStyle.Medium);

    try {
      await logDigitalUsage(user.uid, {
        screenMinutes,
        goalMinutes,
        notes: notes.trim(),
      });

      setIsSaved(true);
      await loadData();
      safeNotificationAsync(NotificationFeedbackType.Success);
    } catch {
      safeNotificationAsync(NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }, [goalMinutes, loadData, notes, screenMinutes, user?.uid]);

  const metrics = useMemo(() => {
    const hours = Math.floor(screenMinutes / 60);
    const minutes = screenMinutes % 60;
    const goalHours = Math.floor(goalMinutes / 60);
    const goalMins = goalMinutes % 60;
    const exceeded = screenMinutes > goalMinutes;
    const rawProgress = goalMinutes > 0 ? (screenMinutes / goalMinutes) * 100 : 0;
    const progress = Math.min(rawProgress, 100);
    const distractionScore = Math.min(
      100,
      Math.round((screenMinutes / Math.max(goalMinutes, 1)) * 70)
    );
    const digitalInsight = exceeded
      ? 'High digital usage is emitted as a Cortex behavior signal. Start a focus block or reduce app exposure.'
      : 'Digital usage is inside the daily goal. Keep logging entries so AltasAI can learn distraction patterns.';
    const focusRecommendation = exceeded
      ? 'Run a 20 minute focus session with distracting apps closed.'
      : 'Protect the current limit and avoid opening secondary feeds before tasks.';

    return {
      hours,
      minutes,
      goalHours,
      goalMins,
      exceeded,
      rawProgress,
      progress,
      distractionScore,
      digitalInsight,
      focusRecommendation,
    };
  }, [goalMinutes, screenMinutes]);

  const markDirty = useCallback(() => setIsSaved(false), []);

  return {
    screenMinutes,
    setScreenMinutes,
    goalMinutes,
    setGoalMinutes,
    notes,
    setNotes,
    streak,
    weeklyAvg,
    history,
    isLoading,
    isSaved,
    markDirty,
    handleSave,
    metrics,
  };
}
