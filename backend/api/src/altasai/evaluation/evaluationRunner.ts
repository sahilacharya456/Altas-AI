import { evaluateEntities } from './evaluateEntities';
import { evaluateIntent } from './evaluateIntent';
import { evaluateRecommendations } from './evaluateRecommendations';
import { evaluateReflection } from './evaluateReflection';
import { evaluateReports } from './evaluateReports';
import { evaluateRiskModels } from './evaluateRiskModels';
import { evaluateSafety } from './evaluateSafety';

const results = [
  evaluateIntent(),
  evaluateEntities(),
  evaluateReflection(),
  evaluateRecommendations(),
  evaluateRiskModels(),
  evaluateReports(),
  evaluateSafety(),
];

console.log('AltasAI internal model evaluation');
for (const result of results) {
  const status = result.passed ? 'PASS' : 'FAIL';
  console.log(`${status} ${result.name}: score=${result.score} threshold=${result.threshold}`);
}

console.log(JSON.stringify(results, null, 2));

if (results.some((result) => !result.passed)) {
  process.exitCode = 1;
}
