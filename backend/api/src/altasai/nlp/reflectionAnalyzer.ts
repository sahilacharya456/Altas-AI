import type { ReflectionAnalysis } from '../core/types';

const positiveWords = ['completed', 'finished', 'won', 'progress', 'consistent', 'focused', 'proud', 'better', 'main task'];
const negativeWords = ['wasted', 'failed', 'stressed', 'tired', 'low energy', 'avoided', 'confused', 'distracted', 'lazy', 'overwhelmed'];
const blockerWords = ['scrolling', 'phone', 'late', 'confused', 'too many', 'tired', 'stress', 'no plan', 'fear'];
const winWords = ['completed', 'finished', 'studied', 'workout', 'focused', 'slept', 'saved'];

const countMatches = (text: string, words: string[]) =>
  words.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);

export const analyzeReflectionText = (input: string): ReflectionAnalysis => {
  const text = input.toLowerCase();
  const positive = countMatches(text, positiveWords);
  const negative = countMatches(text, negativeWords);
  const stress = countMatches(text, ['stress', 'stressed', 'overwhelmed', 'panic', 'pressure', 'burnout']);
  const motivation = countMatches(text, ['motivated', 'ready', 'want', 'will', 'committed', 'focused']);
  const confidence = countMatches(text, ['confident', 'clear', 'sure', 'can', 'finished', 'completed']);

  const blockers = blockerWords.filter((word) => text.includes(word));
  const wins = winWords.filter((word) => text.includes(word));
  const themes = [
    text.includes('scroll') || text.includes('phone') ? 'digital_distraction' : null,
    text.includes('distracted') ? 'distraction' : null,
    text.includes('wasted') || text.includes('delayed') ? 'procrastination' : null,
    text.includes('avoided') || text.includes('avoid') ? 'avoidance' : null,
    text.includes('too many') || text.includes('overwhelmed') || text.includes('confused') ? 'overload' : null,
    text.includes('low energy') || text.includes('tired') ? 'low_energy' : null,
    (text.includes('small task') || text.includes('one small')) && (text.includes('finished') || text.includes('completed')) ? 'small_win' : null,
    text.includes('task') || text.includes('work') ? 'execution' : null,
    text.includes('sleep') || text.includes('tired') ? 'recovery' : null,
    text.includes('money') || text.includes('spent') ? 'finance' : null,
    stress > 0 ? 'stress' : null,
    blockers.length > 0 ? 'blockers' : null,
  ].filter(Boolean) as string[];

  return {
    sentiment: positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral',
    moodScore: Math.max(1, Math.min(5, 3 + positive - negative)),
    stressScore: Math.max(0, Math.min(100, stress * 28 + blockers.length * 8)),
    motivationScore: Math.max(0, Math.min(100, 40 + motivation * 18 + positive * 8 - negative * 6)),
    confidenceScore: Math.max(0, Math.min(100, 45 + confidence * 15 + wins.length * 8 - blockers.length * 8)),
    blockers,
    wins,
    themes: [...new Set(themes)],
  };
};
