import type { BuiltFeatures, InternalAIResult } from '../core/types';

export const detectAnomalies = (features: BuiltFeatures): Array<InternalAIResult<'productivity_drop' | 'overdue_spike' | 'focus_decline' | 'stress_spike' | 'long_inactivity'>> => {
  const anomalies: Array<InternalAIResult<'productivity_drop' | 'overdue_spike' | 'focus_decline' | 'stress_spike' | 'long_inactivity'>> = [];
  const push = (label: typeof anomalies[number]['label'], score: number, evidence: string[], nextAction: string) => {
    if (score >= 50) anomalies.push({
      label,
      score,
      confidence: Number(Math.min(0.9, 0.45 + score / 160).toFixed(2)),
      reasons: ['Detected by threshold and moving-baseline style feature checks.'],
      evidence,
      recommendation: nextAction,
      nextAction,
    });
  };
  push('productivity_drop', 100 - features.executionScore, [`executionScore=${features.executionScore}`], 'Rebuild the day around one completion.');
  push('overdue_spike', features.overdueTaskRatio * 100, [`overdueTaskRatio=${features.overdueTaskRatio.toFixed(2)}`], 'Clear or reschedule overdue tasks.');
  push('focus_decline', features.focusSessions > 0 ? (1 - features.focusConsistency) * 100 : 0, [`focusConsistency=${features.focusConsistency.toFixed(2)}`], 'Use a shorter focus block.');
  push('stress_spike', features.reflectionStressScore, [`stress=${features.reflectionStressScore}`], 'Reduce plan intensity today.');
  push('long_inactivity', features.inactivityDays * 15, [`inactivityDays=${features.inactivityDays}`], 'Log one signal and choose one task.');
  return anomalies.sort((a, b) => b.score - a.score).slice(0, 3);
};
