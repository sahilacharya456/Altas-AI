import { tokenizeForModel } from './vectorizer';

export interface NaiveBayesModel {
  labels: string[];
  labelCounts: Record<string, number>;
  tokenCounts: Record<string, Record<string, number>>;
  totalTokensByLabel: Record<string, number>;
  vocabulary: string[];
  alpha: number;
}

export interface NaiveBayesPrediction {
  label: string;
  confidence: number;
  scores: Record<string, number>;
}

export const trainNaiveBayes = (
  samples: Array<{ text: string; label: string }>,
  alpha = 1
): NaiveBayesModel => {
  const labelCounts: Record<string, number> = {};
  const tokenCounts: Record<string, Record<string, number>> = {};
  const totalTokensByLabel: Record<string, number> = {};
  const vocabulary = new Set<string>();

  for (const sample of samples) {
    labelCounts[sample.label] = (labelCounts[sample.label] ?? 0) + 1;
    tokenCounts[sample.label] ??= {};
    totalTokensByLabel[sample.label] ??= 0;
    for (const token of tokenizeForModel(sample.text)) {
      vocabulary.add(token);
      tokenCounts[sample.label][token] = (tokenCounts[sample.label][token] ?? 0) + 1;
      totalTokensByLabel[sample.label] += 1;
    }
  }

  return {
    labels: Object.keys(labelCounts).sort(),
    labelCounts,
    tokenCounts,
    totalTokensByLabel,
    vocabulary: [...vocabulary].sort(),
    alpha,
  };
};

export const predictNaiveBayes = (model: NaiveBayesModel, text: string): NaiveBayesPrediction => {
  const tokens = tokenizeForModel(text);
  const totalDocuments = Object.values(model.labelCounts).reduce((sum, count) => sum + count, 0);
  const vocabularySize = Math.max(1, model.vocabulary.length);
  const logScores: Record<string, number> = {};

  for (const label of model.labels) {
    let score = Math.log((model.labelCounts[label] + model.alpha) / (totalDocuments + model.labels.length * model.alpha));
    for (const token of tokens) {
      const count = model.tokenCounts[label]?.[token] ?? 0;
      score += Math.log((count + model.alpha) / ((model.totalTokensByLabel[label] ?? 0) + vocabularySize * model.alpha));
    }
    logScores[label] = score;
  }

  const maxScore = Math.max(...Object.values(logScores));
  const expScores = Object.fromEntries(Object.entries(logScores).map(([label, score]) => [label, Math.exp(score - maxScore)]));
  const total = Object.values(expScores).reduce((sum, value) => sum + value, 0);
  const probabilities = Object.fromEntries(Object.entries(expScores).map(([label, value]) => [label, value / Math.max(0.0001, total)]));
  const [label, confidence] = Object.entries(probabilities).sort((a, b) => b[1] - a[1])[0] ?? ['unknown', 0];

  return {
    label,
    confidence: Number(confidence.toFixed(4)),
    scores: Object.fromEntries(Object.entries(probabilities).map(([key, value]) => [key, Number(value.toFixed(4))])),
  };
};
