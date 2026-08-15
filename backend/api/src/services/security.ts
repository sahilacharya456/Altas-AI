export const sanitizePrompt = (input: string | undefined): string => {
  if (!input) return '';
  const trimmed = input.trim();
  
  // Basic heuristic for prompt injection/jailbreaking
  const lower = trimmed.toLowerCase();
  const blockedPhrases = [
    'ignore all previous instructions',
    'you are now',
    'system prompt',
    'forget your previous instructions',
    'ignore previous directions',
    'act as a pirate',
    'disregard rules',
    'bypass',
  ];

  for (const phrase of blockedPhrases) {
    if (lower.includes(phrase)) {
      // If injection detected, neutralize the input
      return "User attempted a prompt injection or out-of-bounds request. I must stick strictly to AltasAI guidelines.";
    }
  }

  // Remove excessive repeated characters which can sometimes confuse LLMs or bypass limits
  const sanitized = trimmed.replace(/(.)\1{10,}/g, '$1$1$1$1$1');
  
  return sanitized;
};

/**
 * Sanitizes AI-generated output text before writing to Firestore.
 * Strips patterns that indicate system-prompt leakage or instruction bleed-through.
 */
export const sanitizeOutput = (text: string | undefined): string => {
  if (!text) return '';
  // Remove anything that looks like leaked system instruction markers
  const stripped = text
    .replace(/(<\|system\|>|<\|user\|>|<\|assistant\|>|\[INST\]|\[\/INST\]|<<SYS>>|<\/SYS>>)/gi, '')
    .replace(/^(system:|assistant:|user:)\s*/gim, '')
    .replace(/Return only valid JSON.*$/im, '')
    .trim();

  // Hard cap at 4000 chars — no AI output should be longer in this domain
  return stripped.slice(0, 4000);
};
