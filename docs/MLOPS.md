# AltasAI MLOps

Implemented:

- Python ML service package
- local datasets
- train command
- evaluation command
- pytest suite
- joblib model artifact
- model registry metadata
- CI steps for Python training/evaluation/tests

Artifacts:

- `backend/ml-service/app/models/trained/intent_classifier.joblib`
- `backend/ml-service/app/models/registry/intent_classifier.json`

Next production steps:

- real anonymized datasets
- train/validation/test split
- model cards per model
- model drift monitoring
- scheduled retraining
- model promotion stages
- rollback strategy
