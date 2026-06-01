export interface ClassificationMetrics {
  total: number;
  correct: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusionMatrix: Record<string, Record<string, number>>;
}

export interface EvaluationResult {
  name: string;
  passed: boolean;
  threshold: number;
  score: number;
  details: unknown;
}

const round = (value: number) => Number(value.toFixed(4));

export const evaluateClassification = (expected: string[], actual: string[]): ClassificationMetrics => {
  const labels = [...new Set([...expected, ...actual])];
  const confusionMatrix: Record<string, Record<string, number>> = {};
  let correct = 0;

  for (const label of labels) confusionMatrix[label] = {};

  expected.forEach((target, index) => {
    const prediction = actual[index] ?? '__missing__';
    if (!confusionMatrix[target]) confusionMatrix[target] = {};
    confusionMatrix[target][prediction] = (confusionMatrix[target][prediction] ?? 0) + 1;
    if (target === prediction) correct += 1;
  });

  const perLabel = labels.map((label) => {
    const truePositive = expected.reduce((count, target, index) => count + (target === label && actual[index] === label ? 1 : 0), 0);
    const falsePositive = actual.reduce((count, prediction, index) => count + (prediction === label && expected[index] !== label ? 1 : 0), 0);
    const falseNegative = expected.reduce((count, target, index) => count + (target === label && actual[index] !== label ? 1 : 0), 0);
    const precision = truePositive / Math.max(1, truePositive + falsePositive);
    const recall = truePositive / Math.max(1, truePositive + falseNegative);
    return { precision, recall, f1: (2 * precision * recall) / Math.max(0.0001, precision + recall) };
  });

  return {
    total: expected.length,
    correct,
    accuracy: round(correct / Math.max(1, expected.length)),
    precision: round(perLabel.reduce((sum, item) => sum + item.precision, 0) / Math.max(1, perLabel.length)),
    recall: round(perLabel.reduce((sum, item) => sum + item.recall, 0) / Math.max(1, perLabel.length)),
    f1: round(perLabel.reduce((sum, item) => sum + item.f1, 0) / Math.max(1, perLabel.length)),
    confusionMatrix,
  };
};

export const exactSetScore = (expected: string[], actual: string[]): number => {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  if (expectedSet.size === 0) return actualSet.size === 0 ? 1 : 0;
  const matches = [...expectedSet].filter((item) => actualSet.has(item)).length;
  return round(matches / expectedSet.size);
};

export const topKAccuracy = (expected: string[], predictions: string[][], k: number): number => {
  const hits = expected.reduce((count, label, index) => count + (predictions[index]?.slice(0, k).includes(label) ? 1 : 0), 0);
  return round(hits / Math.max(1, expected.length));
};

export const average = (values: number[]): number => round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));

export const makeResult = (name: string, score: number, threshold: number, details: unknown): EvaluationResult => ({
  name,
  score: round(score),
  threshold,
  passed: score >= threshold,
  details,
});
