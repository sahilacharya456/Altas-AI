export const priorityPatternMap: Array<[RegExp, 'low' | 'medium' | 'high' | 'critical']> = [
  [/\b(critical|urgent|asap|emergency)\b/i, 'critical'],
  [/\b(high priority|important|high)\b/i, 'high'],
  [/\b(medium|normal)\b/i, 'medium'],
  [/\b(low priority|low)\b/i, 'low'],
];
