# AltasAI ML Service

Python service for heavier AltasAI ML work: trainable classical NLP, risk scoring, recommendation ranking, RAG retrieval, contextual bandit personalization, safety classification, and document/CV adapters.

Run from `backend/ml-service`:

```bash
python -m app.classical_ml.train_intent_classifier
python -m app.evaluation.evaluation_runner
pytest
uvicorn app.main:app --reload --port 8001
```

This service is internal. The TypeScript backend verifies Firebase auth and calls this service only after user context is loaded.
