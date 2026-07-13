import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AppHeader, ScreenContainer } from '../../src/components/layout';
import { GradientButton, SectionHeader } from '../../src/components/common';
import { CommandCard, StatCard } from '../../src/components/cards';
import { EmptyState, ErrorState, LoadingState, RiskBadge } from '../../src/components/feedback';
import { ROUTES } from '../../src/constants/routes';
import { getFocusSessionsForTask, getTask, updateTask } from '../../src/services/data';
import { useTasksStore } from '../../src/stores/tasksStore';
import {
  ALTASAI_COLORS,
  ALTASAI_RADIUS,
  ALTASAI_SPACING,
  ALTASAI_TYPOGRAPHY,
} from '../../src/theme';
import { convertToDate } from '../../src/utils/dateUtils';
import type { FocusSession, Task } from '../../src/types/firestore';

const riskLevelByPriority = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
} as const;

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const { markComplete, start, carry, removeTask } = useTasksStore();
  const [task, setTask] = useState<Task | null>(null);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [context, setContext] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editEstimate, setEditEstimate] = useState('30');
  const [editPriority, setEditPriority] = useState<Task['priority']>('medium');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!taskId) {
        setError('Missing task id.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [loadedTask, loadedSessions] = await Promise.all([
          getTask(taskId),
          getFocusSessionsForTask(taskId),
        ]);
        if (!mounted) return;
        setTask(loadedTask);
        setContext(loadedTask?.context ?? '');
        setEditTitle(loadedTask?.title ?? '');
        setEditEstimate(String(loadedTask?.estimatedMinutes ?? 30));
        setEditPriority(loadedTask?.priority ?? 'medium');
        setSessions(loadedSessions);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load task detail.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [taskId]);

  const focusMinutes = useMemo(
    () => sessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0),
    [sessions]
  );

  const saveContext = async () => {
    if (!taskId) return;
    await updateTask(taskId, { context: context.trim() });
    setTask((current) => current ? { ...current, context: context.trim() } : current);
  };

  const saveTaskFields = async () => {
    if (!taskId || !task) return;
    const title = editTitle.trim();
    const estimatedMinutes = Math.max(1, Math.min(1440, Number.parseInt(editEstimate, 10) || task.estimatedMinutes || 30));

    setIsSaving(true);
    try {
      await updateTask(taskId, {
        title: title || task.title,
        estimatedMinutes,
        priority: editPriority,
      });
      setTask((current) => current
        ? { ...current, title: title || current.title, estimatedMinutes, priority: editPriority }
        : current
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!taskId) return;
    Alert.alert(
      'Delete task',
      'Delete this task permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeTask(taskId);
            router.replace(ROUTES.MAIN.TASKS);
          },
        },
      ]
    );
  };

  const carryTomorrow = async () => {
    if (!taskId) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await carry(taskId, tomorrow);
  };

  if (isLoading) return <LoadingState title="Loading task detail" />;

  if (error) {
    return (
      <ScreenContainer>
        <AppHeader title="Task detail" showBack />
        <ErrorState title="Task unavailable" message={error} />
      </ScreenContainer>
    );
  }

  if (!task || !taskId) {
    return (
      <ScreenContainer>
        <AppHeader title="Task detail" showBack />
        <EmptyState title="Task not found" message="This task may have been deleted or moved." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        eyebrow="Task detail"
        title={task.title}
        subtitle={`${task.status.replace('_', ' ')} - ${task.priority} priority`}
        showBack
        right={<RiskBadge level={riskLevelByPriority[task.priority]} label={task.priority} />}
      />

      <View style={styles.statsGrid}>
        <StatCard label="Estimate" value={`${task.estimatedMinutes}m`} helper="Planned time" tone="info" style={styles.statCard} />
        <StatCard label="Focus" value={`${focusMinutes}m`} helper="Logged sessions" tone={focusMinutes ? 'success' : 'neutral'} style={styles.statCard} />
        <StatCard label="Carry" value={task.carryCount ?? 0} helper="Reschedules" tone={task.carryCount ? 'warning' : 'neutral'} style={styles.statCard} />
      </View>

      <CommandCard eyebrow="Execution" title="Status and schedule">
        <Text style={styles.detailText}>Scheduled: {convertToDate(task.scheduledDate).toLocaleString()}</Text>
        <Text style={styles.detailText}>Category: {task.category}</Text>
        <Text style={styles.detailText}>Source: {task.source ?? 'manual'}</Text>
        {task.goalId ? <Text style={styles.detailText}>Linked goal: {task.goalId}</Text> : null}
        <View style={styles.buttonRow}>
          <GradientButton title="Start Focus" size="sm" onPress={async () => {
            if (task.status !== 'in_progress') await start(taskId);
            router.push({ pathname: ROUTES.MAIN.FOCUS, params: { taskId } } as any);
          }} />
          <GradientButton title="Complete" size="sm" variant="secondary" onPress={() => markComplete(taskId)} />
          <GradientButton title="Carry" size="sm" variant="ghost" onPress={carryTomorrow} />
        </View>
      </CommandCard>

      <CommandCard eyebrow="Edit" title="Task details">
        <Text style={styles.inputLabel}>Title</Text>
        <TextInput
          value={editTitle}
          onChangeText={setEditTitle}
          placeholder="Task title"
          placeholderTextColor={ALTASAI_COLORS.text.muted}
          style={styles.singleLineInput}
        />
        <Text style={styles.inputLabel}>Estimate minutes</Text>
        <TextInput
          value={editEstimate}
          onChangeText={setEditEstimate}
          keyboardType="number-pad"
          placeholder="30"
          placeholderTextColor={ALTASAI_COLORS.text.muted}
          style={styles.singleLineInput}
        />
        <Text style={styles.inputLabel}>Priority</Text>
        <View style={styles.priorityRow}>
          {(['low', 'medium', 'high', 'critical'] as Task['priority'][]).map((priority) => (
            <GradientButton
              key={priority}
              title={priority}
              size="sm"
              variant={editPriority === priority ? 'primary' : 'secondary'}
              onPress={() => setEditPriority(priority)}
            />
          ))}
        </View>
        <View style={styles.buttonRow}>
          <GradientButton title={isSaving ? 'Saving...' : 'Save Changes'} size="sm" disabled={isSaving} onPress={saveTaskFields} />
          <GradientButton title="Delete Task" size="sm" variant="danger" onPress={confirmDelete} />
        </View>
      </CommandCard>

      <CommandCard eyebrow="Notes" title="Execution context">
        <TextInput
          value={context}
          onChangeText={setContext}
          placeholder="Add context, blockers, or the next concrete step."
          placeholderTextColor={ALTASAI_COLORS.text.muted}
          multiline
          style={styles.notesInput}
        />
        <GradientButton title="Save Notes" size="sm" variant="secondary" onPress={saveContext} />
      </CommandCard>

      <CommandCard eyebrow="AI breakdown" title="Backend placeholder">
        <Text style={styles.detailText}>
          AI task breakdown should be generated server-side through the AltasAI backend API. This action is intentionally disabled until that endpoint is wired.
        </Text>
        <GradientButton title="AI Breakdown Not Ready" size="sm" variant="ghost" disabled />
      </CommandCard>

      <SectionHeader title="Focus sessions" subtitle={`${sessions.length} linked session${sessions.length === 1 ? '' : 's'}.`} />
      {sessions.length ? (
        sessions.map((session) => (
          <CommandCard key={session.id} title={`${session.durationMinutes} min`} eyebrow={session.status}>
            <Text style={styles.detailText}>Quality: {session.quality ?? 'Not rated'}</Text>
            <Text style={styles.detailText}>Started: {convertToDate(session.startedAt).toLocaleString()}</Text>
          </CommandCard>
        ))
      ) : (
        <EmptyState title="No focus sessions yet" message="Start a focus session to connect execution data to this task." />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    gap: ALTASAI_SPACING.sm,
  },
  statCard: {
    flex: 1,
  },
  detailText: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
    marginBottom: ALTASAI_SPACING.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ALTASAI_SPACING.sm,
    marginTop: ALTASAI_SPACING.md,
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ALTASAI_SPACING.sm,
    marginBottom: ALTASAI_SPACING.md,
  },
  inputLabel: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    textTransform: 'uppercase',
    marginBottom: ALTASAI_SPACING.xs,
  },
  singleLineInput: {
    minHeight: 48,
    borderRadius: ALTASAI_RADIUS.lg,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
    color: ALTASAI_COLORS.text.primary,
    paddingHorizontal: ALTASAI_SPACING.md,
    marginBottom: ALTASAI_SPACING.md,
  },
  notesInput: {
    minHeight: 112,
    borderRadius: ALTASAI_RADIUS.lg,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
    color: ALTASAI_COLORS.text.primary,
    padding: ALTASAI_SPACING.md,
    marginBottom: ALTASAI_SPACING.md,
    textAlignVertical: 'top',
  },
});
