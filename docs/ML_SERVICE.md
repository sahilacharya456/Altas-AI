# AltasAI ML Service

`backend/ml-service` is the Python service for heavier AltasAI intelligence. The TypeScript backend remains the public API and Firebase security boundary; Python serves internal model training, evaluation, RAG, recommendation, and ML inference.

## Commands

```bash
cd backend/ml-service
python -m app.classical_ml.train_intent_classifier
python -m app.evaluation.evaluation_runner
python -m pytest
uvicorn app.main:app --reload --port 8001
```

Root shortcuts:

```bash
npm run ml:train
npm run ml:evaluate
npm run ml:test
```

## Endpoints

- `GET /health`
- `POST /train/intent`
- `POST /train/all`
- `POST /predict/intent`
- `POST /predict/entities`
- `POST /predict/reflection`
- `POST /predict/risk`
- `POST /predict/safety`
- `POST /recommend/action`
- `POST /recommend/reward`
- `POST /rag/index`
- `POST /rag/query`
- `POST /vision/analyze`
- `POST /evaluate/run`

## Current Reality

The intent model is real TF-IDF + Logistic Regression trained from local data. Risk, safety, CV, and recommendations are explainable baselines. They are not deep learning systems yet.
