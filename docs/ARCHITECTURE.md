# AltasAI Architecture

## Production Direction

AltasAI has one active production backend direction: `backend/api`.

```text
Expo app -> Firebase Auth -> Firestore
Expo app -> Firebase ID token -> Express API -> Firebase Admin -> Firestore
Express API -> AltasAI internal intelligence -> Python ML service when useful -> optional Gemini wording enhancement
```

## Active Folders

- `apps/mobile`: Expo Router app, UI, Firebase client SDK usage, and feature screens.
- `backend/api`: Express backend, protected AI routes, internal intelligence layer, request logging, quota checks, Python ML service client, and optional Gemini provider.
- `backend/ml-service`: FastAPI service for trainable ML, RAG, recommendation, contextual bandit personalization, and evaluation.
- `docs`: current project documentation.
- `archive`: non-runtime historical source.

## Mobile Frontend Architecture

Expo Router route files remain under `apps/mobile/app`. Runtime app composition now lives under `apps/mobile/src/app`:

- `src/app/providers`: root providers for React Query, gestures, error boundary, and toast UI.
- `src/app/navigation`: root navigation/bootstrap flow.
- `src/features/mentor`: feature-local screen, components, hook, service adapter, and types.
- `src/features/reflection`: feature-local screen orchestration, extracted reflection workflow hook, constants, service adapter, step components, styles, and types.
- `src/shared`: bridge exports for shared UI, components, services, hooks, theme, and utils.

This is the target direction for the remaining large modules: route files should stay thin, feature screens should compose feature-local components/hooks, and shared code should live under `src/shared` only when it is truly reusable across domains.

## Inactive / Archived

- `archive/backend_api_legacy`: previous Express/Mongo backend.
- `archive/mobile_api_legacy_services`: previous mobile API client.
- `archive/functions`: historical Firebase Functions source. It is not in `firebase.json`, not part of npm workspaces, and is not production runtime.

## Firebase Usage

Firebase Auth owns identity. The mobile app can read/write user-owned Firestore subcollections according to `firestore.rules`. Server-owned collections such as conversations, AI feedback, reports, and cortex summaries are not writable by clients.

The backend never trusts a client-provided UID. It verifies the Firebase ID token and uses the decoded UID for Firestore paths.

## AI Request Flow

```text
Request
-> request ID + structured logging
-> Firebase token verification
-> quota check
-> compact Firestore memory load
-> AltasAI internal classifier/extractor/pattern/recommendation/planner
-> optional Gemini wording enhancement
-> schema validation/fallback
-> response + Firestore feedback log
```

Gemini is optional. The internal AltasAI planner always runs first and can answer without external AI.

## Startup Product Boundary

Architecture must serve the core startup loop first:

```text
task/reflection/focus signal -> user state -> recommendation -> execution -> report
```

Finance, health, security, and CV/document AI are support modules. They should not distract from the daily execution loop until retention is proven.

## Product Instrumentation

Mobile product events are centralized in `apps/mobile/src/services/analytics/productEvents.ts`. Events are currently buffered locally and should later be sent through the authenticated backend so recommendation acceptance, focus completion, and retention can be measured safely.
