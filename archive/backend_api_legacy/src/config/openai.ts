// Legacy OpenAI client is intentionally disabled. Atlas production AI traffic
// uses authenticated Firebase callable Functions and the server-side AI gateway.
export const openai = null;

// ATLAS Mentor AI Configuration
export const MENTOR_CONFIG = {
  model: 'legacy-openai-disabled',
  temperature: 0.7,
  maxTokens: 500,
  presencePenalty: 0.1,
  frequencyPenalty: 0.1,
};

// Discipline levels and their corresponding AI behavior
export const DISCIPLINE_LEVELS = {
  mentor: {
    name: 'Mentor',
    description: 'Supportive but firm guidance',
    toneModifier: 'Be direct but understanding. Acknowledge struggles while pushing for improvement.',
  },
  strict: {
    name: 'Strict Coach',
    description: 'No-nonsense accountability',
    toneModifier: 'Be firm and authoritative. Challenge excuses immediately. Keep responses short and actionable.',
  },
  ruthless: {
    name: 'Ruthless',
    description: 'Maximum accountability, zero tolerance for excuses',
    toneModifier: 'Be uncompromising. Call out every excuse. Use data to confront failures. No sympathy for repeated mistakes.',
  },
} as const;

export type DisciplineLevel = keyof typeof DISCIPLINE_LEVELS;
