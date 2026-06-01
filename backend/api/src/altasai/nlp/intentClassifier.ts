import samples from '../datasets/intent-samples.json';
import type { AltasIntent, ScoredLabel } from '../core/types';
import { predictNaiveBayes, trainNaiveBayes } from '../ml/naiveBayes';

type IntentRule = {
  intent: AltasIntent;
  patterns: RegExp[];
  weight: number;
};

const rules: IntentRule[] = [
  { intent: 'create_task', weight: 1, patterns: [/\b(remind me|add|create|schedule|put)\b.*\b(task|todo|finish|complete|tomorrow|today)\b/i] },
  { intent: 'update_task', weight: 1, patterns: [/\b(update|change|reschedule|move|edit)\b.*\b(task|todo|deadline)\b/i] },
  { intent: 'delete_task', weight: 1, patterns: [/\b(delete|remove|cancel)\b.*\b(task|todo|reminder)\b/i] },
  { intent: 'complete_task', weight: 1, patterns: [/\b(mark|set)\b.*\b(done|complete|completed|finished)\b/i, /\b(i completed|i finished|done with)\b/i] },
  { intent: 'start_focus', weight: 1, patterns: [/\b(start|begin|run)\b.*\b(focus|deep work|timer|pomodoro)\b/i, /\b\d{1,3}\s*(minute|min)\s+focus\b/i] },
  { intent: 'stop_focus', weight: 1, patterns: [/\b(stop|end|pause)\b.*\b(focus|timer|session|pomodoro)\b/i] },
  { intent: 'reflect_day', weight: 1, patterns: [/\b(reflect|reflection|journal|wasted my day|today was|felt)\b/i] },
  { intent: 'analyze_goal', weight: 1, patterns: [/\b(goal|milestone|break down|analyze my goal|progress on)\b/i] },
  { intent: 'finance_check', weight: 1, patterns: [/\b(spent|expense|money|budget|khata|borrowed|lent|overspent)\b/i] },
  { intent: 'health_check', weight: 1, patterns: [/\b(sleep|water|workout|health|energy|stressed|tired|burnout)\b/i] },
  { intent: 'security_check', weight: 1, patterns: [/\b(link|phishing|scam|suspicious|password|login|security|wifi)\b/i] },
  { intent: 'generate_report', weight: 1, patterns: [/\b(report|weekly progress|daily progress|summary|review my week)\b/i] },
  { intent: 'ask_next_action', weight: 1.35, patterns: [/\b(what should i do next|next action|next step|what now)\b/i] },
  { intent: 'ask_motivation', weight: 0.85, patterns: [/\b(motivate me|no motivation|low motivation|i feel lazy|push me)\b/i] },
  { intent: 'ask_planning_help', weight: 0.95, patterns: [/\b(help me plan|plan my day|make a plan|prioritize my day|schedule my day)\b/i] },
  { intent: 'ask_productivity_advice', weight: 0.9, patterns: [/\b(what should i do|next|advice|help me plan|prioritize|too many tasks)\b/i] },
  { intent: 'ask_mentor', weight: 0.7, patterns: [/\b(mentor|audit me|excuse|discipline|coach)\b/i] },
];

const tokenize = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

const trainedIntentModel = trainNaiveBayes(samples.map((sample) => ({
  text: sample.text,
  label: sample.expectedIntent,
})));

const datasetBoost = (text: string, intent: AltasIntent): number => {
  const input = new Set(tokenize(text));
  let best = 0;
  for (const sample of samples) {
    if (sample.expectedIntent !== intent) continue;
    const sampleTokens = tokenize(sample.text);
    const overlap = sampleTokens.filter((token) => input.has(token)).length;
    best = Math.max(best, overlap / Math.max(sampleTokens.length, 1));
  }
  return best * 0.35;
};

export const classifyIntent = (text: string): ScoredLabel<AltasIntent> => {
  const scores = new Map<AltasIntent, { score: number; reasons: string[] }>();
  const statistical = predictNaiveBayes(trainedIntentModel, text);

  if (statistical.confidence >= 0.18) {
    const label = statistical.label as AltasIntent;
    const current = scores.get(label) ?? { score: 0, reasons: [] };
    current.score += statistical.confidence * 0.85;
    current.reasons.push('matched lightweight local Naive Bayes intent model');
    scores.set(label, current);
  }

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        const current = scores.get(rule.intent) ?? { score: 0, reasons: [] };
        current.score += rule.weight;
        current.reasons.push(`matched ${rule.intent} rule`);
        scores.set(rule.intent, current);
      }
    }
  }

  for (const rule of rules) {
    const current = scores.get(rule.intent) ?? { score: 0, reasons: [] };
    const boost = datasetBoost(text, rule.intent);
    if (boost > 0.05) {
      current.score += boost;
      current.reasons.push('matched local intent examples');
      scores.set(rule.intent, current);
    }
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1].score - a[1].score);
  const [label, data] = ranked[0] ?? ['unknown', { score: 0, reasons: ['no reliable match'] }];
  const confidence = Math.min(0.98, Math.max(label === 'unknown' ? 0.2 : 0.45, data.score / 1.9));
  const topTwoClose = ranked.length > 1 && ranked[0][1].score - ranked[1][1].score < 0.08;
  const finalLabel = confidence < 0.38 || topTwoClose ? 'unknown' : label;

  return {
    label: finalLabel as AltasIntent,
    confidence: Number((finalLabel === 'unknown' ? Math.min(confidence, 0.35) : confidence).toFixed(2)),
    reasons: finalLabel === 'unknown' && ranked.length === 0 ? ['no reliable match'] : data.reasons,
  };
};
