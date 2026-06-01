import samples from '../datasets/reflection-samples.json';
import { analyzeReflectionText } from '../nlp/reflectionAnalyzer';
import { average, evaluateClassification, exactSetScore, makeResult } from './metrics';

export const evaluateReflection = () => {
  const expected = samples.map((sample) => sample.sentiment);
  const actual = samples.map((sample) => analyzeReflectionText(sample.text).sentiment);
  const classification = evaluateClassification(expected, actual);
  const themeScores = samples.map((sample) => exactSetScore(sample.themes, analyzeReflectionText(sample.text).themes));
  const score = average([classification.accuracy, average(themeScores)]);
  return makeResult('reflection_analysis', score, 0.75, {
    sentiment: classification,
    themeCoverage: average(themeScores),
  });
};
