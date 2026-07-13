import { useCallback, useState } from 'react';
import { reviewProof } from '../../../services/ai/proof';
import { recordMentorReward } from '../../../services/ai/mentor';
import { completeTask } from '../../../services/data/tasks';
import { useTasksStore } from '../../../stores/tasksStore';
import { trackProductEvent } from '../../../services/analytics/productEvents';
import { safeNotificationAsync, safeImpactAsync, ImpactFeedbackStyle, NotificationFeedbackType } from '../../../utils/haptics';
import type { ProofType, ProofReviewResult } from '../../../services/ai/proof';
import type { Task } from '../../../types/firestore';

export type ProofStep = 'select_task' | 'choose_type' | 'write_proof' | 'reviewing' | 'result';

export const PROOF_TYPE_OPTIONS: Array<{ id: ProofType; label: string; description: string; icon: string }> = [
  { id: 'text', label: 'Description', description: 'Explain what you built, wrote, or completed', icon: 'TX' },
  { id: 'github_link', label: 'GitHub Commit', description: 'Paste a commit URL or SHA', icon: 'GH' },
  { id: 'study_notes', label: 'Study Notes', description: 'Key concepts, notes, or summary', icon: 'SN' },
  { id: 'file', label: 'File / Output', description: 'Name the file or describe the output', icon: 'FL' },
  { id: 'screenshot', label: 'Screenshot Description', description: 'Describe what the screenshot shows', icon: 'SS' },
  { id: 'other', label: 'Other Evidence', description: 'Any other verifiable proof', icon: 'EV' },
];

export const useProofSubmission = () => {
  const { tasks } = useTasksStore();
  const [step, setStep] = useState<ProofStep>('select_task');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [proofType, setProofType] = useState<ProofType>('text');
  const [proofContent, setProofContent] = useState('');
  const [result, setResult] = useState<ProofReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingTasks = tasks.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  );

  const selectTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setStep('choose_type');
    safeImpactAsync(ImpactFeedbackStyle.Light);
  }, []);

  const selectProofType = useCallback((type: ProofType) => {
    setProofType(type);
    setStep('write_proof');
    safeImpactAsync(ImpactFeedbackStyle.Light);
  }, []);

  const submitProof = useCallback(async () => {
    if (!selectedTask?.id || !proofContent.trim()) return;

    setIsLoading(true);
    setStep('reviewing');
    setError(null);

    trackProductEvent('proof_submitted', {
      userId: selectedTask.userId,
      metadata: { proofType, contentLength: proofContent.length },
    });

    try {
      const review = await reviewProof(
        selectedTask.id,
        selectedTask.title,
        proofType,
        proofContent.trim(),
      );

      setResult(review);
      setStep('result');

      if (review.status === 'verified') {
        await safeNotificationAsync(NotificationFeedbackType.Success);
        // Mark task complete + send positive RL reward
        await completeTask(selectedTask.id);
        void recordMentorReward('mentor_plan', 1.0);
        void recordMentorReward('start_focus', 0.7);
        trackProductEvent('proof_verified', {
          userId: selectedTask.userId,
          metadata: { score: review.score, proofType },
        });
      } else if (review.status === 'weak') {
        await safeImpactAsync(ImpactFeedbackStyle.Medium);
      } else {
        await safeNotificationAsync(NotificationFeedbackType.Error);
        void recordMentorReward('mentor_plan', -0.2);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Proof review failed.');
      setStep('write_proof');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTask, proofType, proofContent]);

  const retry = useCallback(() => {
    setStep('write_proof');
    setResult(null);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setStep('select_task');
    setSelectedTask(null);
    setProofType('text');
    setProofContent('');
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const goBack = useCallback(() => {
    if (step === 'choose_type') setStep('select_task');
    else if (step === 'write_proof') setStep('choose_type');
    else if (step === 'result') reset();
  }, [step, reset]);

  return {
    step,
    pendingTasks,
    selectedTask,
    proofType,
    proofContent,
    setProofContent,
    result,
    isLoading,
    error,
    selectTask,
    selectProofType,
    submitProof,
    retry,
    reset,
    goBack,
  };
};
