# AltasAI

AltasAI is a premium AI-powered life and productivity command center built around one loop:

```text
Signals -> Cortex -> Insight -> Intervention -> Execution -> Report
```

It is not positioned as a simple todo app or chatbot. Tasks, focus sessions, goals, reflections, finance, health, digital usage, and security events become behavior signals. AltasAI uses internal deterministic intelligence first, then optionally asks Gemini to improve final wording when a server-side key is configured.

## Active Runtime

```text
apps/mobile
  -> Firebase Auth
  -> Firestore client SDK for user-owned app data
  -> backend/api over HTTPS for protected AI endpoints

backend/api
  -> verifies Firebase ID tokens
  -> loads compact user context from Firestore
  -> runs AltasAI internal NLP/rules/recommendation pipelines
  -> calls backend/ml-service for trainable ML, RAG, and personalization when available
  -> optionally uses Gemini as wording enhancer
  -> stores AI conversations/feedback with Admin SDK

backend/ml-service
  -> FastAPI Python ML service
  -> TF-IDF + Logistic Regression intent classifier
  -> hybrid entity extraction
  -> user state/risk/recommendation models
  -> TF-IDF RAG retrieval
  -> contextual bandit personalization
  -> CV/document adapter layer

Firebase
  -> Auth
  -> Firestore rules and indexes
```

Active folders:

- `apps/mobile`: Expo React Native app.
- `backend/api`: production Express backend.
- `backend/ml-service`: internal Python ML service for heavier AI/ML work.
- `docs`: current architecture/testing/AI documentation.
- `archive`: historical source that is not production runtime.

The historical Firebase Functions source is archived under `archive/functions`. Firebase Cloud Functions are not required for the current Spark-compatible architecture.

## Features

- Firebase Auth onboarding and protected routing.
- Firestore-backed tasks, goals, focus, reflection, finance, health, digital, security, reports, and profile modules.
- Protected Express AI routes with Firebase ID token verification.
- AltasAI-owned intent classification, entity extraction, reflection analysis, feature building, user state vector, productivity state classification, task ranking, deadline risk scoring, focus readiness prediction, burnout/overload risk scoring, goal progress prediction, habit consistency, finance/health/security pattern analysis, anomaly detection, Cortex insight generation, recommendations, mentor planning, safety guardrails, and report insight generation.
- Optional Gemini wording enhancement from the backend only.
- Deterministic fallback when Gemini/API is unavailable.
- Real backend and mobile smoke tests.

## Environment

Create local env files from examples:

```bash
cp apps/mobile/.env.example apps/mobile/.env
cp backend/api/.env.example backend/api/.env
```

Mobile env values are public Firebase web config only:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_ALTASAI_API_BASE_URL=http://localhost:3001
```

Backend env values stay server-side:

```bash
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
FIREBASE_PROJECT_ID=altasai
FIREBASE_SERVICE_ACCOUNT_JSON={...}
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
AI_DAILY_QUOTA=60
ML_SERVICE_BASE_URL=http://127.0.0.1:8001
ML_SERVICE_TIMEOUT_MS=3500
```

Never place Gemini, OpenAI, Firebase Admin private keys, or service-account JSON in `apps/mobile/.env` or any `EXPO_PUBLIC_*` variable.

## Install

```bash
npm install
```

Node.js 20+ is recommended.

## Local Run

Run the backend:

```bash
npm run api
```

Run Expo Web:

```bash
npm run web --workspace=apps/mobile
```

Run native targets:

```bash
npm run mobile:android
npm run mobile:ios
```

## Validation

```bash
npm run typecheck --workspaces --if-present
npm run api:build
npm test --workspaces --if-present
npm run evaluate:altasai --workspace=@altasai/backend
npm run ml:train
npm run ml:evaluate
npm run ml:test
npm audit --audit-level=high
```

Backend tests cover internal AltasAI intelligence, protected route auth, mentor fallback, quota errors, and health architecture. Mobile tests cover protected routing plus workflow smoke contracts.

Firestore rules tests require Java 21+:

```bash
npm run test:rules --workspace=@altasai/backend
```

## Firebase Setup

Deploy Firestore rules and indexes only:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes --project altasai
```

Do not deploy Firebase Functions for the current architecture.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [AI System](docs/AI_SYSTEM.md)
- [Model Catalog](docs/MODEL_CATALOG.md)
- [ML Service](docs/ML_SERVICE.md)
- [RAG System](docs/RAG_SYSTEM.md)
- [Recommendation System](docs/RECOMMENDATION_SYSTEM.md)
- [RL Personalization](docs/RL_PERSONALIZATION.md)
- [Generative AI](docs/GENERATIVE_AI.md)
- [CV System](docs/CV_SYSTEM.md)
- [Model Evaluation](docs/MODEL_EVALUATION.md)
- [ML Dataset Expansion](docs/ML_DATASET_EXPANSION.md)
- [MLOps](docs/MLOPS.md)
- [Safety Guardrails](docs/SAFETY_GUARDRAILS.md)
- [Startup Focus](docs/STARTUP_FOCUS.md)
- [Product Scorecard](docs/PRODUCT_SCORECARD.md)
- [User Research Plan](docs/USER_RESEARCH_PLAN.md)
- [Master Plan Execution Report](docs/MASTER_PLAN_EXECUTION_REPORT.md)
- [Startup One-Pager](docs/ALTASAI_STARTUP_ONE_PAGER.md)
- [Testing](docs/TESTING.md)
- [Security](docs/SECURITY.md)
- [Firebase Security](docs/FIREBASE_SECURITY.md)
- [Production Readiness](docs/PRODUCTION_READINESS.md)
- [Monitoring](docs/MONITORING.md)
- [Cleanup Report](docs/CLEANUP_REPORT.md)
- [Strict Mentor Audit](docs/STRICT_MENTOR_AUDIT.md)

## Known Limitations

- App Check, crash reporting, production analytics, and deeper abuse monitoring still need production setup.
- Mobile UI still has several large screens that should be split further, especially reflection, mentor, profile, analytics, khata, and dashboard.
- This is not production-launch-ready until App Check, monitoring credentials, Java-21 emulator verification, and real device E2E tests are in place.
