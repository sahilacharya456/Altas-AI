import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { AppHeader, ScreenContainer } from '../../src/components/layout';
import { GradientButton, SectionHeader } from '../../src/components/common';
import { CommandCard, StatCard } from '../../src/components/cards';
import { EmptyState, ErrorState, RiskBadge } from '../../src/components/feedback';
import { AddGoalModal } from '../../src/components/common';
import { useAuthStore } from '../../src/stores/authStore';
import { useGoalsStore } from '../../src/stores/goalsStore';
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
import type { Goal } from '../../src/types/firestore';
import { useToastStore } from '../../src/stores/toastStore';

const priorityRisk = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
} as const;

export default function GoalsScreen() {
  const { user } = useAuthStore();
  const {
    goals,
    initialize,
    addGoal,
    completeMilestone,
    generateBreakdown,
    isLoading,
    error,
  } = useGoalsStore();
  const { addTask } = useTasksStore();
  const showToast = useToastStore((state) => state.showToast);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [busyGoalId, setBusyGoalId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!user?.uid) return;
    setRefreshing(true);
    initialize(user.uid);
    setTimeout(() => setRefreshing(false), 1200);
  }, [user?.uid, initialize]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = initialize(user.uid);
    return () => unsubscribe();
  }, [user?.uid, initialize]);

  const activeGoals = useMemo(() => goals.filter((goal) => goal.status === 'active' || goal.status === 'paused'), [goals]);
  const overallProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length)
    : 0;
  const milestoneCount = activeGoals.reduce((sum, goal) => sum + (goal.milestones?.length ?? 0), 0);
  const openMilestones = activeGoals.reduce(
    (sum, goal) => sum + (goal.milestones?.filter((milestone) => !milestone.completed).length ?? 0),
    0
  );

  const handleCreateGoal = async (goalData: {
    title: string;
    description: string;
    priority: Goal['priority'];
    category: Goal['category'];
    targetDate: Date;
  }) => {
    if (!user) return;

    return addGoal({
      ...goalData,
      status: 'active',
      userId: user.uid,
      milestones: [],
    });
  };

  const handleBreakdown = async (goal: Goal) => {
    if (!goal.id) return;
    setBusyGoalId(goal.id);
    try {
      const milestones = await generateBreakdown(goal.id, goal.title, goal.description);
      showToast(milestones.length ? 'Goal breakdown ready.' : 'Goal breakdown could not be generated.', milestones.length ? 'success' : 'error');
      await safeNotificationAsync(NotificationFeedbackType.Success);
    } finally {
      setBusyGoalId(null);
    }
  };

  const convertMilestoneToTask = async (goal: Goal, milestoneTitle: string) => {
    if (!user) return;
    const scheduledDate = new Date();
    scheduledDate.setHours(9, 0, 0, 0);

    await addTask({
      userId: user.uid,
      title: milestoneTitle,
      category: goal.category,
      priority: goal.priority,
      status: 'pending',
      estimatedMinutes: 45,
      scheduledDate,
      goalId: goal.id,
      source: 'goal',
      context: `Milestone from goal: ${goal.title}`,
    });
    await safeNotificationAsync(NotificationFeedbackType.Success);
  };

  return (
    <ScreenContainer
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ALTASAI_COLORS.accent.bright}
            colors={[ALTASAI_COLORS.accent.bright]}
          />
        ),
      }}
    >
      <Animated.View entering={altasaiCardEntrance(0)}>
        <AppHeader
          eyebrow="Goals"
          title="Long-term execution"
          subtitle={`${activeGoals.length} active goals. Convert vision into executable milestones.`}
          right={<GradientButton title="+ Goal" size="sm" onPress={() => setIsAddModalVisible(true)} />}
        />
      </Animated.View>

      {error ? <ErrorState title="Goals did not load cleanly" message={error} /> : null}

      <Animated.View entering={altasaiCardEntrance(1)}>
        <View style={styles.statsGrid}>
          <StatCard label="Progress" value={`${overallProgress}%`} helper="Across active goals" tone="info" style={styles.statCard} />
          <StatCard label="Milestones" value={milestoneCount} helper="Total planned" tone="neutral" style={styles.statCard} />
          <StatCard label="Open" value={openMilestones} helper="Ready to execute" tone={openMilestones ? 'warning' : 'success'} style={styles.statCard} />
        </View>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(2)}>
        <SectionHeader title="Active goals" subtitle="Progress, milestones, and task conversion." />
        <View style={styles.goalList}>
          {activeGoals.length > 0 ? (
            activeGoals.map((goal, index) => (
              <GoalCard
                key={goal.id ?? `${goal.title}-${index}`}
                goal={goal}
                busy={busyGoalId === goal.id}
                onBreakdown={() => handleBreakdown(goal)}
                onCompleteMilestone={(milestoneIndex) => goal.id && completeMilestone(goal.id, milestoneIndex)}
                onConvertMilestone={(title) => convertMilestoneToTask(goal, title)}
              />
            ))
          ) : (
            <EmptyState
              title={isLoading ? 'Loading goals' : 'No active goals yet'}
              message={isLoading ? 'AltasAI is syncing your goals.' : 'Create one goal, then break it into executable milestones.'}
              actionLabel="Create goal"
              onAction={() => setIsAddModalVisible(true)}
            />
          )}
        </View>
      </Animated.View>

      <AddGoalModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSubmit={handleCreateGoal}
      />
    </ScreenContainer>
  );
}

const GoalCard = ({
  goal,
  busy,
  onBreakdown,
  onCompleteMilestone,
  onConvertMilestone,
}: {
  goal: Goal;
  busy: boolean;
  onBreakdown: () => void;
  onCompleteMilestone: (index: number) => void;
  onConvertMilestone: (title: string) => void;
}) => {
  const targetDate = convertToDate(goal.targetDate);
  const daysLeft = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const milestones = goal.milestones ?? goal.aiBreakdown?.map((title) => ({ title, completed: false })) ?? [];

  return (
    <CommandCard
      eyebrow={`${goal.category} - ${daysLeft > 0 ? `${daysLeft} days left` : 'due now'}`}
      title={goal.title}
      right={<RiskBadge level={priorityRisk[goal.priority]} label={goal.priority} />}
      footer={
        <View style={styles.goalActions}>
          <GradientButton
            title={busy ? 'Generating...' : goal.aiBreakdown?.length ? 'Refresh Breakdown' : 'AI Breakdown'}
            size="sm"
            variant="secondary"
            disabled={busy}
            onPress={onBreakdown}
          />
        </View>
      }
    >
      {goal.description ? <Text style={styles.goalDescription}>{goal.description}</Text> : null}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, goal.progress))}%` }]} />
      </View>
      <Text style={styles.progressText}>{goal.progress}% progress</Text>

      <View style={styles.milestoneList}>
        {milestones.length > 0 ? (
          milestones.slice(0, 5).map((milestone, index) => (
            <View key={`${milestone.title}-${index}`} style={styles.milestoneRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Complete milestone ${milestone.title}`}
                onPress={() => onCompleteMilestone(index)}
                style={[styles.milestoneDot, milestone.completed && styles.milestoneDotDone]}
              />
              <Text numberOfLines={2} style={[styles.milestoneText, milestone.completed && styles.milestoneTextDone]}>
                {milestone.title}
              </Text>
              {!milestone.completed ? (
                <GradientButton title="Task" size="sm" variant="ghost" onPress={() => onConvertMilestone(milestone.title)} />
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.emptyMilestones}>No milestones yet. Use AI Breakdown when the backend is available.</Text>
        )}
      </View>
    </CommandCard>
  );
};

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    gap: ALTASAI_SPACING.sm,
  },
  statCard: {
    flex: 1,
  },
  goalList: {
    gap: ALTASAI_SPACING.md,
  },
  goalDescription: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
    marginBottom: ALTASAI_SPACING.md,
  },
  progressTrack: {
    height: 8,
    borderRadius: ALTASAI_RADIUS.full,
    backgroundColor: ALTASAI_COLORS.surface.strong,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: ALTASAI_RADIUS.full,
    backgroundColor: ALTASAI_COLORS.accent.bright,
  },
  progressText: {
    marginTop: ALTASAI_SPACING.xs,
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  milestoneList: {
    marginTop: ALTASAI_SPACING.md,
    gap: ALTASAI_SPACING.sm,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ALTASAI_SPACING.sm,
  },
  milestoneDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.accent,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
  },
  milestoneDotDone: {
    backgroundColor: ALTASAI_COLORS.success.primary,
    borderColor: ALTASAI_COLORS.success.primary,
  },
  milestoneText: {
    flex: 1,
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
  },
  milestoneTextDone: {
    color: ALTASAI_COLORS.text.muted,
    textDecorationLine: 'line-through',
  },
  emptyMilestones: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
  },
  goalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ALTASAI_SPACING.sm,
  },
});
