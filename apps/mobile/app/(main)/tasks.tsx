import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated from 'react-native-reanimated';

import { AppHeader, ScreenContainer } from '../../src/components/layout';
import { GradientButton, SectionHeader } from '../../src/components/common';
import { CommandCard, StatCard } from '../../src/components/cards';
import { EmptyState, ErrorState, RiskBadge, RiskLevel } from '../../src/components/feedback';
import { AddTaskModal } from '../../src/components/common';
import { ROUTES } from '../../src/constants/routes';
import { useAuthStore } from '../../src/stores/authStore';
import { useTasksStore } from '../../src/stores/tasksStore';
import {
  ALTASAI_COLORS,
  ALTASAI_RADIUS,
  ALTASAI_SPACING,
  ALTASAI_TYPOGRAPHY,
} from '../../src/theme';
import { altasaiCardEntrance } from '../../src/utils/animations';
import { convertToDate } from '../../src/utils/dateUtils';
import { safeNotificationAsync, NotificationFeedbackType } from '../../src/utils/haptics';
import type { Task } from '../../src/types/firestore';

type FilterStatus = 'today' | 'pending' | 'in_progress' | 'carried' | 'completed';
type PriorityFilter = 'all' | Task['priority'];

const statusTabs: Array<{ id: FilterStatus; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'pending', label: 'Pending' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'carried', label: 'Carried' },
  { id: 'completed', label: 'Completed' },
];

const priorities: Array<{ id: PriorityFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

const riskLevelByPriority: Record<Task['priority'], RiskLevel> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
};

const formatTime = (date: Task['scheduledDate']) =>
  convertToDate(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const formatDate = (date: Task['scheduledDate']) =>
  convertToDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const isToday = (date: Task['scheduledDate']) => {
  const d = convertToDate(date);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

export default function TasksScreen() {
  const { user } = useAuthStore();
  const {
    tasks,
    summary,
    isLoading,
    error,
    initialize,
    markComplete,
    carry,
    start,
    addTask,
  } = useTasksStore();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('today');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = initialize(user.uid);
    return () => unsubscribe();
  }, [user?.uid, initialize]);

  const grouped = useMemo(() => ({
    pending: tasks.filter((task) => task.status === 'pending'),
    inProgress: tasks.filter((task) => task.status === 'in_progress'),
    carried: tasks.filter((task) => task.isCarried || task.status === 'carried'),
    completed: tasks.filter((task) => task.status === 'completed'),
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    const byStatus = tasks.filter((task) => {
      if (statusFilter === 'today') return isToday(task.scheduledDate);
      if (statusFilter === 'carried') return task.isCarried || task.status === 'carried';
      return task.status === statusFilter;
    });

    return byStatus.filter((task) => priorityFilter === 'all' || task.priority === priorityFilter);
  }, [tasks, statusFilter, priorityFilter]);

  const handleCreateTask = async (taskData: {
    title: string;
    priority: Task['priority'];
    category: Task['category'];
    estimatedMinutes: number;
    scheduledDate: Date;
  }) => {
    if (!user) return;

    return addTask({
      ...taskData,
      status: 'pending',
      source: 'manual',
      userId: user.uid,
    });
  };

  const handleCarry = useCallback(async (taskId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await carry(taskId, tomorrow);
  }, [carry]);

  const handleStartFocus = async (task: Task) => {
    if (!task.id) return;
    if (task.status !== 'in_progress') {
      await start(task.id);
    }
    router.push({ pathname: ROUTES.MAIN.FOCUS, params: { taskId: task.id } } as any);
  };

  return (
    <ScreenContainer>
      <Animated.View entering={altasaiCardEntrance(0)}>
        <AppHeader
          eyebrow="Execute"
          title="Today's execution board"
          subtitle={`${summary.completed}/${summary.total} completed. Keep the next action obvious.`}
          right={<GradientButton title="+ Task" size="sm" onPress={() => setIsAddModalVisible(true)} />}
        />
      </Animated.View>

      {error ? <ErrorState title="Tasks did not load cleanly" message={error} /> : null}

      <Animated.View entering={altasaiCardEntrance(1)}>
        <View style={styles.statsGrid}>
          <StatCard label="Pending" value={grouped.pending.length} helper="Ready to start" tone="warning" style={styles.statCard} />
          <StatCard label="In progress" value={grouped.inProgress.length} helper="Active execution" tone="info" style={styles.statCard} />
          <StatCard label="Carried" value={grouped.carried.length} helper="Execution debt" tone={grouped.carried.length ? 'danger' : 'neutral'} style={styles.statCard} />
        </View>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(2)}>
        <CommandCard eyebrow="Current focus" title={grouped.inProgress[0]?.title ?? 'No active task'}>
          {grouped.inProgress[0] ? (
            <View style={styles.focusRow}>
              <Text style={styles.focusText}>
                {grouped.inProgress[0].estimatedMinutes} min planned - {grouped.inProgress[0].priority} priority
              </Text>
              <GradientButton title="Resume Focus" size="sm" onPress={() => handleStartFocus(grouped.inProgress[0])} />
            </View>
          ) : (
            <Text style={styles.mutedText}>Start one task before opening secondary modules.</Text>
          )}
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(3)}>
        <SectionHeader title="Views" subtitle="Separate planning from execution debt." />
        <View style={styles.chipRow}>
          {statusTabs.map((tab) => (
            <FilterChip
              key={tab.id}
              label={tab.label}
              active={statusFilter === tab.id}
              onPress={() => setStatusFilter(tab.id)}
            />
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(4)}>
        <SectionHeader title="Priority" subtitle="Filter down to the pressure that matters." />
        <View style={styles.chipRow}>
          {priorities.map((priority) => (
            <FilterChip
              key={priority.id}
              label={priority.label}
              active={priorityFilter === priority.id}
              onPress={() => setPriorityFilter(priority.id)}
            />
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(5)}>
        <SectionHeader title="Execution list" subtitle={`${filteredTasks.length} task${filteredTasks.length === 1 ? '' : 's'} shown.`} />
        <View style={styles.taskList}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task, index) => (
              <TaskCard
                key={task.id ?? `${task.title}-${index}`}
                task={task}
                onComplete={() => task.id && markComplete(task.id)}
                onCarry={() => task.id && handleCarry(task.id)}
                onFocus={() => handleStartFocus(task)}
                onOpen={() => router.push({ pathname: ROUTES.MAIN.TASK_DETAIL, params: { taskId: task.id } } as any)}
              />
            ))
          ) : (
            <EmptyState
              title={isLoading ? 'Loading tasks' : 'No tasks in this view'}
              message={isLoading ? 'AltasAI is syncing your execution board.' : 'Create a task or switch filters to find work.'}
              actionLabel="Create task"
              onAction={() => setIsAddModalVisible(true)}
            />
          )}
        </View>
      </Animated.View>

      <AddTaskModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSubmit={handleCreateTask}
      />
    </ScreenContainer>
  );
}

const FilterChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ selected: active }}
    onPress={onPress}
    style={[styles.chip, active && styles.chipActive]}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

const TaskCard = ({
  task,
  onComplete,
  onCarry,
  onFocus,
  onOpen,
}: {
  task: Task;
  onComplete: () => void;
  onCarry: () => void;
  onFocus: () => void;
  onOpen: () => void;
}) => (
  <CommandCard
    title={task.title}
    eyebrow={`${formatDate(task.scheduledDate)} at ${formatTime(task.scheduledDate)}`}
    right={<RiskBadge level={riskLevelByPriority[task.priority]} label={task.priority} />}
    footer={<TaskActions task={task} onComplete={onComplete} onCarry={onCarry} onFocus={onFocus} />}
  >
    <Pressable accessibilityRole="button" onPress={onOpen} style={styles.taskBody}>
      <Text style={styles.taskMeta}>
        {task.status.replace('_', ' ')} - {task.estimatedMinutes} min - {task.category}
        {task.carryCount ? ` - carried ${task.carryCount}x` : ''}
      </Text>
      {task.context ? <Text style={styles.taskContext}>{task.context}</Text> : null}
    </Pressable>
  </CommandCard>
);

const TaskActions = ({
  task,
  onComplete,
  onCarry,
  onFocus,
}: {
  task: Task;
  onComplete: () => void;
  onCarry: () => void;
  onFocus: () => void;
}) => (
  <View style={styles.cardActions}>
    <RiskBadge level={riskLevelByPriority[task.priority]} label={task.priority} />
    {task.status !== 'completed' ? (
      <>
        <GradientButton title="Focus" size="sm" onPress={onFocus} />
        <GradientButton title="Done" size="sm" variant="secondary" onPress={onComplete} />
        <GradientButton title="Carry" size="sm" variant="ghost" onPress={onCarry} />
      </>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    gap: ALTASAI_SPACING.sm,
  },
  statCard: {
    flex: 1,
  },
  focusRow: {
    gap: ALTASAI_SPACING.md,
  },
  focusText: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
  },
  mutedText: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ALTASAI_SPACING.sm,
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: ALTASAI_RADIUS.full,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
    paddingHorizontal: ALTASAI_SPACING.md,
  },
  chipActive: {
    borderColor: ALTASAI_COLORS.border.accent,
    backgroundColor: ALTASAI_COLORS.accent.glow,
  },
  chipText: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  chipTextActive: {
    color: ALTASAI_COLORS.text.primary,
  },
  taskList: {
    gap: ALTASAI_SPACING.sm,
  },
  taskBody: {
    minHeight: 44,
    justifyContent: 'center',
  },
  taskMeta: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    textTransform: 'capitalize',
  },
  taskContext: {
    marginTop: ALTASAI_SPACING.xs,
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: ALTASAI_SPACING.sm,
  },
});
