export const OUT_OF_CONTEXT_RESPONSE = 'sorry this is out of context for me';

const PROJECT_TERMS = [
  'altasai',
  'atlasai',
  'task',
  'tasks',
  'goal',
  'goals',
  'focus',
  'deadline',
  'priority',
  'priorities',
  'productivity',
  'discipline',
  'audit',
  'excuse',
  'excuses',
  'coach',
  'habit',
  'habits',
  'reflection',
  'reflections',
  'report',
  'briefing',
  'cortex',
  'mentor',
  'intervention',
  'schedule',
  'planning',
  'plan',
  'execute',
  'execution',
  'budget',
  'expense',
  'expenses',
  'finance',
  'spending',
  'health',
  'sleep',
  'burnout',
  'stress',
  'security',
  'cyber',
  'hack',
  'hacking',
  'account',
  'phishing',
  'device',
  'password',
  'scam',
  'workflow',
  'dashboard',
  'profile',
  'analytics',
] as const;

const OFF_TOPIC_TERMS = [
  'recipe',
  'movie',
  'sports',
  'celebrity',
  'politics',
  'weather',
  'lyrics',
  'joke',
  'game cheat',
  'homework answer',
  'write essay',
] as const;

export const isProjectScopedInput = (input?: string): boolean => {
  const normalized = (input ?? '').trim().toLowerCase();
  if (!normalized) return true;

  if (PROJECT_TERMS.some((term) => normalized.includes(term))) {
    return true;
  }

  if (OFF_TOPIC_TERMS.some((term) => normalized.includes(term))) {
    return false;
  }

  const directActionPatterns = [
    /\bwhat should i do\b/,
    /\bwhat do i do\b/,
    /\bhelp me (start|finish|prioritize|organize|plan|execute)\b/,
    /\bhow (can|do) i (start|finish|prioritize|organize|plan|execute)\b/,
    /\bi am (stuck|stressed|overwhelmed|behind|procrastinating)\b/,
    /\bi feel (stuck|stressed|overwhelmed|behind)\b/,
  ];

  return directActionPatterns.some((pattern) => pattern.test(normalized));
};
