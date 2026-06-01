import fs from 'node:fs';
import path from 'node:path';
import intentSamples from '../datasets/intent-samples.json';
import { trainNaiveBayes } from './naiveBayes';
import { trainVectorizer } from './vectorizer';

const samples = intentSamples.map((sample) => ({ text: sample.text, label: sample.expectedIntent }));
const model = {
  trainedAt: new Date().toISOString(),
  sampleCount: samples.length,
  vectorizer: trainVectorizer(samples.map((sample) => sample.text)),
  classifier: trainNaiveBayes(samples),
};

const outputPath = path.join(__dirname, 'trained-intent-model.json');
fs.writeFileSync(outputPath, `${JSON.stringify(model, null, 2)}\n`, 'utf8');
console.log(`Wrote AltasAI intent model to ${outputPath}`);
