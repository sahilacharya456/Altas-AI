import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
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
    editGoal,
    removeGoal,
    markComplete,
    setProgress,
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

  const handleEditGoal = async (goal: Goal, data: Partial<Goal>) => {
    if (!goal.id) return;
    try {
      await editGoal(goal.id, data);
      showToast('Goal updated.', 'success');
    } catch (editError) {
      showToast(editError instanceof Error ? editError.message : 'Goal could not be updated.', 'error');
    }
  };

  const handleProgressChange = async (goal: Goal, progress: number) => {
    if (!goal.id) return;
    try {
      await setProgress(goal.id, progress);
    } catch (progressError) {
      showToast(progressError instanceof Error ? progressError.message : 'Goal progress could not be updated.', 'error');
    }
  };

  const handleCompleteGoal = async (goal: Goal) => {
    if (!goal.id) return;
    try {
      await markComplete(goal.id);
      showToast('Goal completed.', 'success');
      await safeNotificationAsync(NotificationFeedbackType.Success);
    } catch (completeError) {
      showToast(completeError instanceof Error ? completeError.message : 'Goal could not be completed.', 'error');
    }
  };

  const confirmDeleteGoal = (goal: Goal) => {
    if (!goal.id) return;

    Alert.alert(
      'Delete goal?',
      `This removes "${goal.title}" and its milestones.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeGoal(goal.id!);
              showToast('Goal deleted.', 'success');
            } catch (deleteError) {
              showToast(deleteError instanceof Error ? deleteError.message : 'Goal could not be deleted.', 'error');
            }
          },
        },
      ]
    );
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
                onEdit={(data) => handleEditGoal(goal, data)}
                onProgressChange={(progress) => handleProgressChange(goal, progress)}
                onCompleteGoal={() => handleCompleteGoal(goal)}
                onDelete={() => confirmDeleteGoal(goal)}
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
  onEdit,
  onProgressChange,
  onCompleteGoal,
  onDelete,
  onCompleteMilestone,
  onConvertMilestone,
}: {
  goal: Goal;
  busy: boolean;
  onBreakdown: () => void;
  onEdit: (data: Partial<Goal>) => void;
  onProgressChange: (progress: number) => void;
  onCompleteGoal: () => void;
  onDelete: () => void;
  onCompleteMilestone: (index: number) => void;
  onConvertMilestone: (title: string) => void;
}) => {
  const targetDate = convertToDate(goal.targetDate);
  const daysLeft = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const milestones = goal.milestones ?? goal.aiBreakdown?.map((title) => ({ title, completed: false })) ?? [];
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(goal.title);
  const [draftDescription, setDraftDescription] = useState(goal.description ?? '');

  useEffect(() => {
    setDraftTitle(goal.title);
    setDraftDescription(goal.description ?? '');
  }, [goal.description, goal.title]);

  const saveEdits = () => {
    onEdit({
      title: draftTitle.trim() || goal.title,
      description: draftDescription.trim(),
    });
    setIsEditing(false);
  };

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
            style={styles.goalActionButton}
          />
          <GradientButton
            title={isEditing ? 'Close' : 'Edit'}
            size="sm"
            variant="ghost"
            onPress={() => setIsEditing((value) => !value)}
            style={styles.goalActionButton}
          />
          <GradientButton
            title="Done"
            size="sm"
            variant="ghost"
            onPress={onCompleteGoal}
            style={styles.goalActionButton}
          />
          <GradientButton
            title="Delete"
            size="sm"
            variant="danger"
            onPress={onDelete}
            style={styles.goalActionButton}
          />
        </View>
      }
    >
      {isEditing ? (
        <View style={styles.editPanel}>
          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            value={draftTitle}
            onChangeText={setDraftTitle}
            placeholder="Goal title"
            placeholderTextColor={ALTASAI_COLORS.text.muted}
            style={styles.goalInput}
            maxLength={80}
          />
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            value={draftDescription}
            onChangeText={setDraftDescription}
            placeholder="Why this goal matters"
            placeholderTextColor={ALTASAI_COLORS.text.muted}
            style={[styles.goalInput, styles.goalTextArea]}
            maxLength={240}
            multiline
          />
          <GradientButton title="Save changes" size="sm" onPress={saveEdits} />
        </View>
      ) : null}
      {goal.description ? <Text style={styles.goalDescription}>{goal.description}</Text> : null}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, goal.progress))}%` }]} />
      </View>
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>{goal.progress}% progress</Text>
        <View style={styles.progressActions}>
          <GradientButton title="-10" size="sm" variant="ghost" onPress={() => onProgressChange(Math.max(0, goal.progress - 10))} />
          <GradientButton title="+10" size="sm" variant="ghost" onPress={() => onProgressChange(Math.min(100, goal.progress + 10))} />
        </View>
      </View>

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
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  progressRow: {
    marginTop: ALTASAI_SPACING.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: ALTASAI_SPACING.sm,
  },
  progressActions: {
    flexDirection: 'row',
    gap: ALTASAI_SPACING.xs,
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
    flexWrap: 'wrap',
    gap: ALTASAI_SPACING.sm,
  },
  goalActionButton: {
    minWidth: 92,
  },
  editPanel: {
    gap: ALTASAI_SPACING.sm,
    marginBottom: ALTASAI_SPACING.md,
  },
  inputLabel: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalInput: {
    minHeight: 44,
    borderRadius: ALTASAI_RADIUS.md,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
    color: ALTASAI_COLORS.text.primary,
    paddingHorizontal: ALTASAI_SPACING.md,
    paddingVertical: ALTASAI_SPACING.sm,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
  },
  goalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
