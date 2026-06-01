import type { ExtractedEntity } from '../core/types';
import { relativeDatePatterns } from '../regex/datePatterns';
import { moneyPattern, financeLanguagePattern } from '../regex/financePatterns';
import { healthHabitPattern } from '../regex/healthPatterns';
import { negativeMoodPattern, blockerPattern } from '../regex/moodPatterns';
import { priorityPatternMap } from '../regex/priorityPatterns';
import { defensiveSecurityPattern } from '../regex/securityPatterns';
import { durationPattern, clockTimePattern } from '../regex/timePatterns';
import { taskTitlePattern } from '../regex/taskPatterns';

export const extractEntities = (text: string, now = new Date()): ExtractedEntity[] => {
  // Guard against ReDoS on pathologically long inputs before any regex runs.
  const safeText = text.length > 2000 ? text.slice(0, 2000) : text;
  // eslint-disable-next-line no-param-reassign
  text = safeText;
  const entities: ExtractedEntity[] = [];

  const duration = text.match(durationPattern);
  if (duration) {
    const unit = duration[2].toLowerCase();
    const minutes = /h/.test(unit) ? Number(duration[1]) * 60 : Number(duration[1]);
    entities.push({ type: 'duration', value: minutes, raw: duration[0], confidence: 0.92 });
  }

  const money = [...text.matchAll(moneyPattern)]
    .filter(() => financeLanguagePattern.test(text));
  for (const match of money.slice(0, 3)) {
    entities.push({ type: 'moneyAmount', value: Number(match[1]), raw: match[0].trim(), confidence: 0.78 });
  }

  for (const [pattern, value] of priorityPatternMap) {
    const match = text.match(pattern);
    if (match) {
      entities.push({ type: 'priority', value, raw: match[0], confidence: 0.85 });
      break;
    }
  }

  const datePatterns: Array<[RegExp, () => Date]> = [
    [relativeDatePatterns.tomorrow, () => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)],
    [relativeDatePatterns.today, () => new Date(now.getFullYear(), now.getMonth(), now.getDate())],
    [relativeDatePatterns.nextWeek, () => new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)],
  ];
  for (const [pattern, getDate] of datePatterns) {
    const match = text.match(pattern);
    if (match) entities.push({ type: 'deadline', value: getDate().toISOString(), raw: match[0], confidence: 0.8 });
  }

  const time = text.match(clockTimePattern);
  if (time && /\b(at|by|before|after|around)\b/i.test(text)) {
    entities.push({ type: 'time', value: time[0], raw: time[0], confidence: 0.65 });
  }

  const taskTitle = text.match(taskTitlePattern);
  if (taskTitle?.[1]) {
    entities.push({ type: 'taskTitle', value: taskTitle[1].trim(), raw: taskTitle[1].trim(), confidence: 0.74 });
  }

  const goalTitle = text.match(/\b(?:goal|analyze my goal|break down)\s+(?:to|for)?\s*(.+)$/i);
  if (goalTitle?.[1]) {
    entities.push({ type: 'goalTitle', value: goalTitle[1].trim(), raw: goalTitle[1].trim(), confidence: 0.68 });
  }

  const moodMatch = text.match(/\b(stressed|anxious|tired|low energy|motivated|confident|confused|overwhelmed|distracted)\b/i);
  if (moodMatch || negativeMoodPattern.test(text)) {
    entities.push({ type: 'mood', value: moodMatch?.[0] ?? 'negative', raw: moodMatch?.[0] ?? text, confidence: 0.72 });
  }

  const blockerMatch = text.match(blockerPattern);
  if (blockerMatch) {
    entities.push({ type: 'productivityBlocker', value: blockerMatch[0], raw: blockerMatch[0], confidence: 0.76 });
  }

  const healthMatch = text.match(healthHabitPattern);
  if (healthMatch) {
    entities.push({ type: 'healthHabit', value: healthMatch[0], raw: healthMatch[0], confidence: 0.72 });
  }

  const securityMatch = text.match(defensiveSecurityPattern);
  if (securityMatch) {
    entities.push({ type: 'securityConcern', value: securityMatch[0], raw: securityMatch[0], confidence: 0.82 });
  }

  const actionRequest = text.match(/\b(what should i do next|help me|plan|prioritize|recommend|tell me)\b/i);
  if (actionRequest) {
    entities.push({ type: 'actionRequest', value: actionRequest[0], raw: actionRequest[0], confidence: 0.7 });
  }

  return entities;
};
