# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AltasAI is an AI-powered life and productivity command center. The core loop is:
Signals -> Cortex -> Insight -> Intervention -> Execution -> Report.

It uses internal deterministic TypeScript intelligence first, optionally enhancing responses with Gemini when a server-side key is configured. The Python ML service provides heavier ML work (intent classification, risk scoring, RAG) with graceful fallback to TypeScript when unavailable.

## Monorepo Structure

npm workspaces: `apps/mobile`, `backend/api`, `packages/*`.
The `archive/` directory is historical source not used at runtime.

## Commands

```bash
# Install
npm install                # Node 20+ required

# Run
npm run api               # Backend dev server (port 3001, tsx watch)
npm run mobile            # Expo start (mobile)
npm run web --workspace=apps/mobile  # Expo web

# Validate (CI runs all of these)
npm run typecheck --workspaces --if-present
npm run api:build
npm test --workspaces --if-present
npm run evaluate:altasai --workspace=@altasai/backend
npm run ml:train          # requires Python 3.12 + pip install -r backend/ml-service/requirements.txt
npm run ml:evaluate
npm run ml:test

# Single test
npx jest --runInBand path/to/test.ts              # from backend/api or apps/mobile
npm run test:rules --workspace=@altasai/backend   # Firestore rules (requires Java 21 + emulator)

# Firebase
npx firebase deploy --only firestore:rules,firestore:indexes --project altasai
```

## Architecture

### Mobile (`apps/mobile`)
- **Framework**: Expo SDK 54, React Native 0.81.5, Expo Router 6 (file-based routing)
- **Routing**: `app/(auth)/` (welcome, login, register, onboarding) and `app/(main)/` (tabs + hidden screens). Auth gating via `resolveInitialRoute.ts` checks Firebase auth state + onboarding completion.
- **State**: Zustand stores (`authStore`, `tasksStore`, `goalsStore`, `analyticsStore`, `toastStore`) with real-time Firestore subscriptions.
- **Styling**: NativeWind 4 (Tailwind for RN) + comprehensive design tokens in `src/theme/` (dark-mode-first, emerald accent system).
- **Services**: `src/services/firebase/` (auth, firestore, config), `src/services/ai/` (backendClient + per-endpoint modules with offline fallbacks), `src/services/data/` (Firestore CRUD for each domain).
- **Path aliases**: `@/*` → `src/*`, `@features/*`, `@components/*`, `@hooks/*`, `@stores/*`, `@services/*`, `@utils/*`, `@types/*`, etc.

### Backend (`backend/api`)
- **Stack**: Express + Firebase Admin + Zod + Helmet + rate-limit
- **Auth middleware**: Verifies Firebase ID tokens from `Authorization: Bearer` header.
- **AI routes** (`/api/*`): `/mentor`, `/daily-briefing`, `/weekly-report`, `/goal-breakdown`, `/reflection-feedback`, `/budget-discipline`, `/interventions`, `/security-advice`, `/cortex`, `/recommendations/feedback`
- **AltasAI intelligence** (`src/altasai/`): Orchestrator runs NLP (intent, entity, reflection analysis) → feature builder → 11 deterministic models → Cortex insight engine → recommendations → optional Gemini wording.
- **Gemini**: Server-side only via `@google/genai`. Every endpoint has a deterministic fallback when Gemini is unavailable.
- **Quota**: Per-user daily limits enforced via Firestore transaction in `services/quota.ts`.

### ML Service (`backend/ml-service`)
- **Stack**: FastAPI, scikit-learn, pandas, numpy
- **Endpoints**: `/predict/intent`, `/predict/entities`, `/predict/reflection`, `/predict/risk`, `/predict/safety`, `/recommend`, `/rag`, `/vision`
- **Integration**: Backend calls ML service via `mlServiceClient.ts` (timeout 3.5s); all failures gracefully fall back to TypeScript models.

### Firebase
- Auth (email/password), Firestore (all user data under `users/{uid}/` path), security rules with validation.
- Firestore rules tests require Java 21 + emulator.

## Key Patterns

- All AI endpoints return deterministic fallback responses when external services fail.
- The mobile app operates in "demo mode" if Firebase env vars are missing (uses in-memory persistence).
- Backend `services/memory.ts` loads compact user context from 11 Firestore collections with independent error handling per collection.
- The evaluation runner (`src/altasai/evaluation/`) enforces accuracy thresholds for all internal models — CI fails if any model drops below threshold.
- Feature flags in `apps/mobile/src/config/featureFlags.ts` gate unreleased features.

## Environment

Backend requires `.env` with: `PORT`, `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON` (required in prod), `GEMINI_API_KEY` (optional), `ML_SERVICE_BASE_URL`.

Mobile requires `.env` with: `EXPO_PUBLIC_FIREBASE_*` vars and `EXPO_PUBLIC_ALTASAI_API_BASE_URL`.

Never place server-side secrets in `EXPO_PUBLIC_*` variables.

## Testing

- Backend: Jest + supertest + `@firebase/rules-unit-testing`. Tests in `src/__tests__/`.
- Mobile: Jest + ts-jest. Tests in `src/__tests__/` and colocated `.test.ts` files.
- ML: pytest + httpx. Tests in `app/tests/`.
- Mobile jest uses `moduleNameMapper` for `@/` path alias.

## Formatting

- 2-space indent, LF line endings, UTF-8, trailing newline.
- TypeScript strict mode in both mobile and backend.
