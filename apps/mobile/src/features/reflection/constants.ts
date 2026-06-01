import type { ReflectionOption, ReflectionStep } from './types';

export const reflectionSteps: ReflectionStep[] = [
  'intro',
  'mood',
  'energy',
  'wins',
  'challenges',
  'gratitude',
  'summary',
];

export const moodOptions: ReflectionOption[] = [
  { value: 1, emoji: '\u{1F62B}', label: 'Rough' },
  { value: 2, emoji: '\u{1F615}', label: 'Not Great' },
  { value: 3, emoji: '\u{1F610}', label: 'Okay' },
  { value: 4, emoji: '\u{1F642}', label: 'Good' },
  { value: 5, emoji: '\u{1F929}', label: 'Amazing' },
];

export const energyOptions: ReflectionOption[] = [
  { value: 1, emoji: '\u{1F50B}', label: 'Drained' },
  { value: 2, emoji: '\u{1F971}', label: 'Low' },
  { value: 3, emoji: '\u{2615}', label: 'Medium' },
  { value: 4, emoji: '\u{1F4AA}', label: 'High' },
  { value: 5, emoji: '\u{26A1}', label: 'Peak' },
];
