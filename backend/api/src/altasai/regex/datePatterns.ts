export const relativeDatePatterns = {
  today: /\btoday\b/i,
  tomorrow: /\btomorrow\b/i,
  nextWeek: /\bnext\s+week\b/i,
  thisWeek: /\bthis\s+week\b/i,
};

export const isoLikeDatePattern = /\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/;

export const deadlineLanguagePattern = /\b(by|before|due|deadline|finish|submit)\b/i;
