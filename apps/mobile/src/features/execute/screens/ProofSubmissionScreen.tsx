import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { GlassCard } from '../../../components/ui/GlassCard';
import { ALTASAI_COLORS } from '../../../theme/colors';
import { ALTASAI_SPACING } from '../../../theme/spacing';
import { ALTASAI_TYPOGRAPHY } from '../../../theme/typography';
import { PROOF_TYPE_OPTIONS, useProofSubmission } from '../hooks/useProofSubmission';
import type { Task } from '../../../types/firestore';
import type { ProofType } from '../../../services/ai/proof';

// Shared header

function ScreenHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  return (
    <Animated.View entering={FadeInDown.duration(380)} style={styles.header}>
      {onBack && (
        <Pressable onPress={onBack} style={styles.backButton} accessibilityLabel="Go back">
          <Text style={styles.backChevron}>{'<'}</Text>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      )}
      <Text style={styles.eyebrow}>PROOF ENGINE</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Animated.View>
  );
}

// Step 1: Select task

function SelectTaskStep({ tasks, onSelect }: { tasks: Task[]; onSelect: (t: Task) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="Which task did you complete?"
        subtitle="Only tasks in progress or pending are shown."
      />
      {tasks.length === 0 ? (
        <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
          <Text style={styles.emptyIcon}>0</Text>
          <Text style={styles.emptyTitle}>No pending tasks</Text>
          <Text style={styles.emptyBody}>Add a task first, then prove you completed it.</Text>
        </Animated.View>
      ) : (
        tasks.map((task, i) => (
          <Animated.View key={task.id ?? i} entering={FadeInUp.delay(i * 40).duration(340)}>
            <GlassCard pressable onPress={() => onSelect(task)} style={styles.taskCard}>
              <View style={styles.taskCardInner}>
                <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
                  <Text style={styles.taskMeta}>
                    {task.priority.toUpperCase()} - {task.category}
                    {task.carryCount > 0 ? ` - carried ${task.carryCount}x` : ''}
                  </Text>
                </View>
                <Text style={styles.taskArrow}>{'>'}</Text>
              </View>
            </GlassCard>
          </Animated.View>
        ))
      )}
    </ScrollView>
  );
}

// Step 2: Choose proof type

function ChooseTypeStep({ onSelect, onBack }: { onSelect: (t: ProofType) => void; onBack: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        title="How will you prove it?"
        subtitle="Pick the format that best shows what you actually did."
        onBack={onBack}
      />
      {PROOF_TYPE_OPTIONS.map((opt, i) => (
        <Animated.View key={opt.id} entering={FadeInUp.delay(i * 50).duration(340)}>
          <GlassCard pressable onPress={() => onSelect(opt.id)} style={styles.typeCard}>
            <View style={styles.typeCardInner}>
              <Text style={styles.typeIcon}>{opt.icon}</Text>
              <View style={styles.typeInfo}>
                <Text style={styles.typeLabel}>{opt.label}</Text>
                <Text style={styles.typeDesc}>{opt.description}</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

// Step 3: Write proof

function WriteProofStep({
  task,
  proofType,
  content,
  onChange,
  onSubmit,
  onBack,
  error,
}: {
  task: Task;
  proofType: ProofType;
  content: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  error: string | null;
}) {
  const opt = PROOF_TYPE_OPTIONS.find((o) => o.id === proofType)!;
  const canSubmit = content.trim().length >= 15;

  const PLACEHOLDERS: Record<ProofType, string> = {
    text: 'Describe exactly what you completed. Be specific: file name, output, lines written, test result.',
    github_link: 'Paste your GitHub commit URL or SHA (e.g. https://github.com/org/repo/commit/abc1234)',
    study_notes: 'Write 3-5 key concepts you learned or summarize what you studied and how.',
    file: 'Name the file you created or modified. Describe what changed (e.g. auth.ts - added JWT validation, 120 lines).',
    screenshot: 'Describe what the screenshot shows: UI state, test pass, output, or completed result.',
    other: 'Describe your evidence. Be specific enough that someone else could verify it happened.',
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Prove your work."
          subtitle={`Task: "${task.title}"`}
          onBack={onBack}
        />

        {/* Type badge */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.typeBadge}>
          <Text style={styles.typeBadgeIcon}>{opt.icon}</Text>
          <Text style={styles.typeBadgeLabel}>{opt.label}</Text>
        </Animated.View>

        {/* Input */}
        <Animated.View entering={FadeInUp.delay(80).duration(380)}>
          <GlassCard style={styles.inputCard}>
            <TextInput
              style={styles.proofInput}
              placeholder={PLACEHOLDERS[proofType]}
              placeholderTextColor={ALTASAI_COLORS.text.muted}
              value={content}
              onChangeText={onChange}
              multiline
              autoFocus
              maxLength={1500}
              selectionColor={ALTASAI_COLORS.accent.bright}
            />
            <Text style={styles.charCount}>{content.length}/1500</Text>
          </GlassCard>
        </Animated.View>

        {/* Proof rule reminder */}
        <Animated.View entering={FadeInUp.delay(120).duration(380)} style={styles.ruleBox}>
          <Text style={styles.ruleText}>
            AltasAI requires specific evidence. "I finished it" is rejected. A file name, commit, or measurable output is verified.
          </Text>
        </Animated.View>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {/* Submit */}
        <Animated.View entering={FadeInUp.delay(160).duration(380)}>
          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit}
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            accessibilityLabel="Submit proof"
          >
            <LinearGradient
              colors={canSubmit
                ? ['rgba(56, 189, 248, 0.92)', 'rgba(16, 185, 129, 0.80)']
                : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.06)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <Text style={[styles.submitLabel, !canSubmit && styles.submitLabelDisabled]}>
                Submit to AltasAI
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Reviewing (loading)

function ReviewingStep() {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.centerState}>
      <Text style={styles.reviewingIcon}>AI</Text>
      <Text style={styles.reviewingTitle}>AltasAI is reviewing your proof</Text>
      <Text style={styles.reviewingBody}>Checking your evidence against execution standards.</Text>
    </Animated.View>
  );
}

// Step 5: Result

const STATUS_CONFIG = {
  verified: { color: ALTASAI_COLORS.success.primary, border: 'rgba(16, 185, 129, 0.35)', icon: 'OK', label: 'VERIFIED' },
  weak: { color: ALTASAI_COLORS.warning.light, border: 'rgba(245, 158, 11, 0.35)', icon: '!', label: 'WEAK' },
  rejected: { color: ALTASAI_COLORS.error.primary, border: 'rgba(239, 68, 68, 0.35)', icon: 'X', label: 'REJECTED' },
};

function ResultStep({
  result,
  task,
  onRetry,
  onDone,
}: {
  result: NonNullable<ReturnType<typeof useProofSubmission>['result']>;
  task: Task;
  onRetry: () => void;
  onDone: () => void;
}) {
  const cfg = STATUS_CONFIG[result.status];

  return (
    <ScrollView contentContainerStyle={styles.stepContent} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.duration(480)} style={styles.resultHeader}>
        <Text style={[styles.resultIcon, { color: cfg.color }]}>{cfg.icon}</Text>
        <Text style={[styles.resultStatus, { color: cfg.color }]}>{cfg.label}</Text>
        {result.status === 'verified' && (
          <Text style={styles.resultScore}>{result.score}/100</Text>
        )}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(100).duration(420)}>
        <GlassCard style={[styles.verdictCard, { borderColor: cfg.border }]}>
          <Text style={styles.verdictLabel}>AltasAI verdict</Text>
          <Text style={styles.verdictText}>{result.feedbackToUser}</Text>
        </GlassCard>
      </Animated.View>

      {result.status === 'verified' && (
        <Animated.View entering={FadeInUp.delay(160).duration(420)} style={styles.completedBanner}>
          <Text style={styles.completedBannerText}>
            Task "{task.title}" marked complete.
          </Text>
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.delay(200).duration(420)} style={styles.resultActions}>
        {result.status !== 'verified' && (
          <Pressable onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryLabel}>Improve and resubmit</Text>
          </Pressable>
        )}
        <Pressable onPress={onDone} style={styles.doneButton}>
          <LinearGradient
            colors={['rgba(56, 189, 248, 0.92)', 'rgba(16, 185, 129, 0.80)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            <Text style={styles.submitLabel}>
              {result.status === 'verified' ? 'Done' : 'Close'}
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

// Root screen

export default function ProofSubmissionScreen() {
  const {
    step,
    pendingTasks,
    selectedTask,
    proofType,
    proofContent,
    setProofContent,
    result,
    error,
    selectTask,
    selectProofType,
    submitProof,
    retry,
    reset,
    goBack,
  } = useProofSubmission();

  const handleDone = () => {
    reset();
    router.back();
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[ALTASAI_COLORS.background.primary, ALTASAI_COLORS.background.secondary, ALTASAI_COLORS.background.tertiary]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Close button */}
        {step !== 'reviewing' && (
          <View style={styles.topBar}>
            <Pressable onPress={handleDone} style={styles.closeButton} accessibilityLabel="Close">
              <Text style={styles.closeLabel}>X</Text>
            </Pressable>
          </View>
        )}

        {step === 'select_task' && (
          <SelectTaskStep tasks={pendingTasks} onSelect={selectTask} />
        )}
        {step === 'choose_type' && (
          <ChooseTypeStep onSelect={selectProofType} onBack={goBack} />
        )}
        {step === 'write_proof' && selectedTask && (
          <WriteProofStep
            task={selectedTask}
            proofType={proofType}
            content={proofContent}
            onChange={setProofContent}
            onSubmit={submitProof}
            onBack={goBack}
            error={error}
          />
        )}
        {step === 'reviewing' && <ReviewingStep />}
        {step === 'result' && result && selectedTask && (
          <ResultStep result={result} task={selectedTask} onRetry={retry} onDone={handleDone} />
        )}
      </SafeAreaView>
    </View>
  );
}

// Constants

const PRIORITY_COLORS: Record<string, string> = {
  low: ALTASAI_COLORS.text.muted,
  medium: ALTASAI_COLORS.accent.primary,
  high: '#F59E0B',
  critical: '#EF4444',
};

// Styles

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: ALTASAI_SPACING.md,
    paddingTop: ALTASAI_SPACING.sm,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  closeLabel: { color: ALTASAI_COLORS.text.secondary, fontSize: 16 },
  stepContent: {
    paddingHorizontal: ALTASAI_SPACING.md,
    paddingTop: ALTASAI_SPACING.md,
    paddingBottom: ALTASAI_SPACING['2xl'],
    gap: ALTASAI_SPACING.sm,
  },
  header: { marginBottom: ALTASAI_SPACING.sm },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: ALTASAI_SPACING.sm },
  backChevron: { fontSize: 22, color: ALTASAI_COLORS.accent.bright, marginRight: 4 },
  backLabel: { fontSize: ALTASAI_TYPOGRAPHY.size.sm, color: ALTASAI_COLORS.accent.bright },
  eyebrow: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    color: ALTASAI_COLORS.accent.bright,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    letterSpacing: 1,
    marginBottom: ALTASAI_SPACING[1],
  },
  title: {
    fontSize: ALTASAI_TYPOGRAPHY.size['2xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: ALTASAI_COLORS.text.primary,
    lineHeight: 32,
    marginBottom: ALTASAI_SPACING[1],
  },
  subtitle: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.secondary,
    lineHeight: 20,
  },

  // Task selection
  taskCard: { marginBottom: 0 },
  taskCardInner: { flexDirection: 'row', alignItems: 'center', gap: ALTASAI_SPACING.sm },
  priorityDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  taskInfo: { flex: 1 },
  taskTitle: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    color: ALTASAI_COLORS.text.primary,
    lineHeight: 22,
  },
  taskMeta: {
    marginTop: 2,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    color: ALTASAI_COLORS.text.tertiary,
  },
  taskArrow: { fontSize: 20, color: ALTASAI_COLORS.text.muted },

  // Type selection
  typeCard: { marginBottom: 0 },
  typeCardInner: { flexDirection: 'row', alignItems: 'center', gap: ALTASAI_SPACING.sm },
  typeIcon: { fontSize: 22, width: 32, textAlign: 'center', color: ALTASAI_COLORS.accent.bright },
  typeInfo: { flex: 1 },
  typeLabel: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    color: ALTASAI_COLORS.text.primary,
  },
  typeDesc: {
    marginTop: 2,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    color: ALTASAI_COLORS.text.secondary,
    lineHeight: 17,
  },

  // Write proof
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ALTASAI_SPACING[2],
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 999,
    paddingHorizontal: ALTASAI_SPACING.sm,
    paddingVertical: ALTASAI_SPACING[1],
    marginBottom: ALTASAI_SPACING[1],
  },
  typeBadgeIcon: { fontSize: 13, color: ALTASAI_COLORS.accent.bright },
  typeBadgeLabel: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    color: ALTASAI_COLORS.accent.bright,
  },
  inputCard: { marginBottom: 0 },
  proofInput: {
    minHeight: 140,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.primary,
    lineHeight: 21,
    textAlignVertical: 'top',
  },
  charCount: {
    marginTop: ALTASAI_SPACING[2],
    fontSize: 10,
    color: ALTASAI_COLORS.text.muted,
    alignSelf: 'flex-end',
  },
  ruleBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.18)',
    borderRadius: 8,
    padding: ALTASAI_SPACING.sm,
  },
  ruleText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    color: ALTASAI_COLORS.text.secondary,
    lineHeight: 18,
  },
  errorText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    color: ALTASAI_COLORS.error.primary,
  },
  submitButton: { borderRadius: 10, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.45 },
  submitGradient: {
    paddingVertical: ALTASAI_SPACING.md,
    alignItems: 'center',
    borderRadius: 10,
  },
  submitLabel: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  submitLabelDisabled: { color: ALTASAI_COLORS.text.muted },

  // Reviewing
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ALTASAI_SPACING.xl,
    gap: ALTASAI_SPACING.md,
  },
  reviewingIcon: { fontSize: 52, color: ALTASAI_COLORS.accent.bright },
  reviewingTitle: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xl,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: ALTASAI_COLORS.text.primary,
    textAlign: 'center',
  },
  reviewingBody: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.secondary,
    textAlign: 'center',
  },

  // Result
  resultHeader: {
    alignItems: 'center',
    paddingVertical: ALTASAI_SPACING.xl,
    gap: ALTASAI_SPACING.sm,
  },
  resultIcon: { fontSize: 52 },
  resultStatus: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xl,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    letterSpacing: 2,
  },
  resultScore: {
    fontSize: ALTASAI_TYPOGRAPHY.size['3xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: ALTASAI_COLORS.text.primary,
  },
  verdictCard: { borderWidth: 1 },
  verdictLabel: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    color: ALTASAI_COLORS.accent.bright,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    letterSpacing: 0.8,
    marginBottom: ALTASAI_SPACING[2],
  },
  verdictText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.primary,
    lineHeight: 22,
  },
  completedBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.30)',
    borderRadius: 8,
    padding: ALTASAI_SPACING.sm,
  },
  completedBannerText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.success.light,
    lineHeight: 20,
  },
  resultActions: { gap: ALTASAI_SPACING.sm },
  retryButton: {
    padding: ALTASAI_SPACING.md,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  retryLabel: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    color: ALTASAI_COLORS.text.secondary,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  doneButton: { borderRadius: 10, overflow: 'hidden' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: ALTASAI_SPACING.xl, gap: ALTASAI_SPACING.sm },
  emptyIcon: { fontSize: 36, color: ALTASAI_COLORS.text.muted },
  emptyTitle: {
    fontSize: ALTASAI_TYPOGRAPHY.size.lg,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: ALTASAI_COLORS.text.primary,
  },
  emptyBody: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.secondary,
    textAlign: 'center',
  },
});
