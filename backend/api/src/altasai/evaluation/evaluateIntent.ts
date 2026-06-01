import samples from '../datasets/intent-samples.json';
import { classifyIntent } from '../nlp/intentClassifier';
import { evaluateClassification, makeResult } from './metrics';

export const evaluateIntent = () => {
  const expected = samples.map((sample) => sample.expectedIntent);
  const actual = samples.map((sample) => classifyIntent(sample.text).label);
  const metrics = evaluateClassification(expected, actual);
  return makeResult('intent_classification', metrics.accuracy, 0.8, metrics);
};
