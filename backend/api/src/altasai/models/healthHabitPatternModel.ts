import type { InternalAIResult } from '../core/types';

export const analyzeHealthHabits = (healthLogs: Array<Record<string, unknown>>): InternalAIResult<'low_consistency' | 'stable' | 'unknown'> => {
  if (!healthLogs.length) {
    return {
      label: 'unknown',
      score: 45,
      confidence: 0.35,
      reasons: ['No health habit logs are available.'],
      evidence: ['healthLogs=0'],
      recommendation: 'Track sleep, water, workout, or energy once today.',
      nextAction: 'Add one health habit log.',
    };
  }
  const avg = healthLogs.reduce((sum, log) => sum + Number(log.routineScore ?? Number(log.energyLevel ?? 3) * 20), 0) / healthLogs.length;
  return {
    label: avg >= 60 ? 'stable' : 'low_consistency',
    score: Math.round(avg),
    confidence: 0.7,
    reasons: ['Health habit model scores user-entered routine and energy logs without diagnosis.'],
    evidence: [`healthLogs=${healthLogs.length}`, `average=${avg.toFixed(1)}`],
    recommendation: avg >= 60 ? 'Keep routine stable around work blocks.' : 'Reduce plan intensity and restore one basic habit.',
    nextAction: avg >= 60 ? 'Protect sleep and focus timing.' : 'Log water, sleep, or a short walk.',
  };
};
