# AltasAI Model Evaluation

Python ML evaluation command:

```bash
npm run ml:evaluate
```

Evaluated areas:

- intent classifier
- entity extractor
- risk models
- recommendation engine
- RAG retrieval
- safety guardrail
- vision adapter

Metrics include accuracy, F1 where applicable, entity coverage, risk bucket correctness, recommendation top-3 acceptability, RAG recall, and safety accuracy.

Important limitation: the current datasets are small seed datasets. Passing evaluation catches regressions but does not prove production ML quality.
