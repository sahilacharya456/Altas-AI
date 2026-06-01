import samples from '../datasets/entity-samples.json';
import { extractEntities } from '../nlp/entityExtractor';
import { average, exactSetScore, makeResult } from './metrics';

export const evaluateEntities = () => {
  const scores = samples.map((sample) => {
    const actual = extractEntities(sample.input).map((entity) => entity.type);
    return exactSetScore(sample.expectedEntities, actual);
  });
  return makeResult('entity_extraction', average(scores), 0.75, {
    averageExactTypeCoverage: average(scores),
    cases: samples.length,
  });
};
