# AltasAI Internal AI System

AltasAI is not a Gemini wrapper. The backend runs internal deterministic intelligence first and treats Gemini as an optional wording enhancer.

## Runtime Flow

```text
User data + message
-> Firebase Auth verification
-> Safe memory retrieval
-> FeatureBuilder
-> UserStateVector
-> Intent classification
-> Entity extraction
-> optional Python ML service for trained intent, RAG, recommendation, and personalization
-> Productivity, risk, focus, goal, habit, finance, health, security, anomaly models
-> Recommendation ranking
-> Cortex insight
-> Safety guardrail
-> Mentor response plan
-> optional Gemini wording enhancement
-> structured response + optional Firestore save
```

## Active Backend Folders

- `backend/api/src/altasai/core`
- `backend/api/src/altasai/feature-store`
- `backend/api/src/altasai/models`
- `backend/api/src/altasai/nlp`
- `backend/api/src/altasai/regex`
- `backend/api/src/altasai/rules`
- `backend/api/src/altasai/recommendation`
- `backend/api/src/altasai/pipelines`
- `backend/api/src/altasai/datasets`
- `backend/api/src/altasai/evaluation`
- `backend/api/src/altasai/ml`
- `backend/api/src/altasai/clients`
- `backend/ml-service/app`

## Gemini Policy

Gemini is server-side only. It can improve wording for Mentor responses and selected briefing/report text, but internal AltasAI outputs are authoritative: intent, entities, user state vector, risk scores, recommendations, safety constraints, and Cortex insight.

If Gemini is unavailable, malformed, slow, or unconfigured, AltasAI returns deterministic internal output.

## Safety Boundaries

AltasAI does not provide medical diagnosis, financial guarantees, or offensive cybersecurity help. Health and burnout outputs are productivity/wellbeing risk guidance, not clinical claims.

## Testing

Backend tests cover protected auth failure, Mentor fallback, quota errors, Cortex, security guardrails, intent/entity/reflection models, productivity/risk/focus/burnout/goal/habit models, finance/health/anomaly/Cortex/report intelligence, and user state vector generation.

## Evaluation Harness

Run:

```bash
npm run evaluate:altasai --workspace=@altasai/backend
```

The harness evaluates intent classification, entity extraction, reflection analysis, recommendation ranking, risk buckets, report completeness, and safety guardrails. It fails the process if any threshold is missed.

## Lightweight ML

Intent classification combines deterministic rules with a local Naive Bayes text classifier trained from `intent-samples.json`. This is transparent project-specific ML, not an LLM. The trained artifact is stored at `backend/api/src/altasai/ml/trained-intent-model.json`.

## Python ML Service

`backend/ml-service` adds heavier ML and MLOps support:

- TF-IDF + Logistic Regression intent model
- hybrid entity extraction
- reflection sentiment/emotion scoring
- user state vector and risk scoring
- RAG indexing/query
- recommendation and contextual bandit personalization
- safety classification
- CV/document adapter
- model registry metadata
- pytest and evaluation runner

The TypeScript backend calls it through `backend/api/src/altasai/clients/mlServiceClient.ts`. If the service is unavailable, existing TypeScript models remain the fallback.
