# AltasAI ML Dataset Expansion

## Implemented

The ML service now has expanded seed datasets and deterministic generation tooling:

- `backend/ml-service/app/datasets/intent_samples.json`: expanded from 21 to 65 labeled examples.
- `backend/ml-service/app/datasets/entity_samples.json`: expanded from 6 to 20 extraction cases.
- `backend/ml-service/app/datasets/safety_samples.json`: expanded from 4 to 18 safety cases.
- `backend/ml-service/app/datasets/recommendation_feedback_samples.json`: added reward-feedback training examples.
- `backend/ml-service/app/datasets/generate_synthetic_samples.py`: deterministic template generator for additional realistic seed samples.

The intent classifier artifact was retrained after dataset expansion.

## Latest Evaluation

`npm run ml:evaluate`:

- intent classifier: 1.0
- entity extractor: 0.9833
- risk models: 1.0
- recommendation engine: 1.0
- RAG retrieval: 1.0
- safety guardrail: 0.9444
- vision adapter: 1.0

## Strict Limitation

This is now a stronger local dataset baseline, not a production-scale dataset. True production trust still requires anonymized real user feedback, dataset versioning, holdout sets, drift monitoring, and retraining governance.
