import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AppHeader, ScreenContainer } from '../../src/components/layout';
import { GradientButton, SectionHeader } from '../../src/components/common';
import { CommandCard, StatCard } from '../../src/components/cards';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/feedback';
import {
  completeFocusSession,
  getTask,
  startFocusSession,
} from '../../src/services/data';
import { useAuthStore } from '../../src/stores/authStore';
import { useTasksStore } from '../../src/stores/tasksStore';
import {
  ALTASAI_COLORS,
  ALTASAI_RADIUS,
  ALTASAI_SPACING,
  ALTASAI_TYPOGRAPHY,
} from '../../src/theme';
import { safeNotificationAsync, NotificationFeedbackType } from '../../src/utils/haptics';
import type { Task } from '../../src/types/firestore';

export default function FocusScreen() {
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const { user } = useAuthStore();
  const { markComplete } = useTasksStore();
  const [task, setTask] = useState<Task | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!taskId || !user?.uid) {
        setError('Missing task or user context.');
        setIsLoading(false);
        return;
      }

      try {
        const loadedTask = await getTask(taskId);
        if (!mounted) return;
        setTask(loadedTask);
        const newSessionId = await startFocusSession({
          userId: user.uid,
          taskId,
          goalId: loadedTask?.goalId,
          plannedMinutes: loadedTask?.estimatedMinutes,
        });
        if (!mounted) return;
        setSessionId(newSessionId);
        setIsRunning(true);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to start focus session.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [taskId, user?.uid]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
  const displayTime = useMemo(() => {
    const minutes = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
    const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [elapsedSeconds]);

  const endSession = async (completeTask: boolean) => {
    if (!sessionId || !taskId) return;
    setIsRunning(false);
    await completeFocusSession(sessionId, {
      taskId,
      goalId: task?.goalId,
      durationMinutes: elapsedMinutes,
      quality,
      notes,
    });
    if (completeTask) {
      await markComplete(taskId, elapsedMinutes);
    }
    await safeNotificationAsync(NotificationFeedbackType.Success);
    router.back();
  };

  if (isLoading) return <LoadingState title="Starting focus mode" />;

  if (error) {
    return (
      <ScreenContainer>
        <AppHeader title="Focus Mode" showBack />
        <ErrorState title="Focus session unavailable" message={error} />
      </ScreenContainer>
    );
  }

  if (!task) {
    return (
      <ScreenContainer>
        <AppHeader title="Focus Mode" showBack />
        <EmptyState title="Task not found" message="Select a task before starting focus mode." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        eyebrow="Focus Mode"
        title={task.title}
        subtitle="Single-task execution. Pause only if the context truly changes."
        showBack
      />

      <CommandCard eyebrow="Timer" title={displayTime}>
        <View style={styles.timerStats}>
          <StatCard label="Planned" value={`${task.estimatedMinutes}m`} helper="Task estimate" tone="info" style={styles.statCard} />
          <StatCard label="Logged" value={`${elapsedMinutes}m`} helper="Current session" tone="success" style={styles.statCard} />
        </View>
        <View style={styles.buttonRow}>
          <GradientButton title={isRunning ? 'Pause' : 'Resume'} variant="secondary" onPress={() => setIsRunning((value) => !value)} />
          <GradientButton title="Complete Task" onPress={() => endSession(true)} />
          <GradientButton title="End Session" variant="ghost" onPress={() => endSession(false)} />
        </View>
      </CommandCard>

      <CommandCard eyebrow="Quality" title="Rate execution quality">
        <View style={styles.qualityRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <GradientButton
              key={value}
              title={String(value)}
              size="sm"
              variant={quality === value ? 'primary' : 'secondary'}
              onPress={() => setQuality(value as 1 | 2 | 3 | 4 | 5)}
            />
          ))}
        </View>
      </CommandCard>

      <CommandCard eyebrow="Session note" title="What affected focus?">
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional: blockers, wins, distractions, or next step."
          placeholderTextColor={ALTASAI_COLORS.text.muted}
          multiline
          style={styles.notesInput}
        />
      </CommandCard>

      <SectionHeader title="Behavior signal" subtitle="Completion saves focus minutes and emits a behavior-ready event." />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  timerStats: {
    flexDirection: 'row',
    gap: ALTASAI_SPACING.sm,
  },
  statCard: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ALTASAI_SPACING.sm,
    marginTop: ALTASAI_SPACING.md,
  },
  qualityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ALTASAI_SPACING.sm,
  },
  notesInput: {
    minHeight: 112,
    borderRadius: ALTASAI_RADIUS.lg,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
    color: ALTASAI_COLORS.text.primary,
    padding: ALTASAI_SPACING.md,
    textAlignVertical: 'top',
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
  },
});
