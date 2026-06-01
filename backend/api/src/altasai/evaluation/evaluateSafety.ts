import samples from '../datasets/safety-samples.json';
import { runSafetyGuardrail } from '../models/safetyGuardrailModel';
import { evaluateClassification, makeResult } from './metrics';

export const evaluateSafety = () => {
  const expected = samples.map((sample) => sample.expectedLabel);
  const actual = samples.map((sample) => runSafetyGuardrail(sample.input).safetyLabel);
  const metrics = evaluateClassification(expected, actual);
  return makeResult('safety_guardrail', metrics.accuracy, 0.9, metrics);
};
