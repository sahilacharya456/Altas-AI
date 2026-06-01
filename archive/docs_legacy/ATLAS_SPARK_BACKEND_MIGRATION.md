# Atlas AI Spark Backend Migration

Date: 2026-05-29

## Current Architecture Found

Atlas AI is a monorepo with:

- `apps/mobile`: Expo React Native app using Firebase Auth, Firestore, Expo Router, Zustand, React Query, and Atlas Command OS UI.
- `backend/api`: new Spark-compatible Express API for server-side AI calls.
- `backend/api_legacy`: archived Express/Mongo-style backend retained for reference.
- `functions`: previous Firebase Cloud Functions implementation retained as historical source, no longer configured as a deploy target.
- `firestore.rules` and `firestore.indexes.json`: Spark-compatible Firebase database protection.

The mobile app now uses Firebase directly for Auth/Firestore and calls `backend/api` for AI endpoints.

## Why Cloud Functions Were Removed

The Firebase project is on the Spark plan. Firebase Cloud Functions deployment requires Blaze because Google Cloud Build and Artifact Registry must be enabled. To keep Atlas AI free-plan friendly, Firebase Functions were removed from runtime/deploy configuration.

Firebase Spark is now used only for:

- Firebase Authentication
- Firestore
- Firestore rules/indexes

## Replacement Plan Implemented

The selected replacement is a Render-compatible Express backend under `backend/api`.

Reason:

- The repository already has backend workspaces.
- Express fits the existing codebase better than adding Vercel project structure.
- Render free tier can run an authenticated Node API without Firebase Blaze.
- Mobile can call one HTTPS backend base URL in development and production.

Target flow:

```text
Expo app
  -> Firebase Auth ID token
  -> backend/api endpoint
  -> Firebase Admin verifies token
  -> backend retrieves compact Firestore context
  -> backend calls Gemini if configured
  -> backend returns structured response or offline fallback
```

## Backend Endpoints

All endpoints require `Authorization: Bearer <Firebase ID token>`.

- `POST /api/mentor`
- `POST /api/daily-briefing`
- `POST /api/weekly-report`
- `POST /api/goal-breakdown`
- `POST /api/reflection-feedback`
- `POST /api/budget-discipline`
- `POST /api/interventions`
- `POST /api/security-advice`
- `GET /health`

## Security Decisions

- No Gemini/OpenAI key is exposed to Expo.
- Mobile uses `EXPO_PUBLIC_ATLAS_API_BASE_URL` only.
- Backend uses `GEMINI_API_KEY` and `FIREBASE_SERVICE_ACCOUNT_JSON`.
- Backend validates request bodies with Zod.
- Backend rate limits `/api` routes.
- Backend stores minimal AI feedback/conversation metadata.
- Raw secrets are never logged.

## Files Changed

- `backend/api/package.json`
- `backend/api/tsconfig.json`
- `backend/api/.env.example`
- `backend/api/src/app.ts`
- `backend/api/src/server.ts`
- `backend/api/src/config/env.ts`
- `backend/api/src/lib/firebaseAdmin.ts`
- `backend/api/src/lib/http.ts`
- `backend/api/src/middleware/auth.ts`
- `backend/api/src/routes/ai.routes.ts`
- `backend/api/src/services/gemini.ts`
- `backend/api/src/services/memory.ts`
- `backend/api/src/services/prompts.ts`
- `apps/mobile/src/services/ai/backendClient.ts`
- `apps/mobile/src/services/ai/command.ts`
- `apps/mobile/src/services/ai/mentor.ts`
- `apps/mobile/src/services/ai/reports.ts`
- `apps/mobile/src/services/ai/interventions.ts`
- `apps/mobile/src/services/ai/security.ts`
- `apps/mobile/src/services/ai/budget.ts`
- `apps/mobile/src/services/ai/index.ts`
- `apps/mobile/app/(main)/budget-insights.tsx`
- `apps/mobile/app/(main)/mentor.tsx`
- `apps/mobile/app/(main)/task-detail.tsx`
- `apps/mobile/src/services/firebase/auth.ts`
- `apps/mobile/.env`
- `apps/mobile/.env.example`
- `firebase.json`
- `package.json`
- `package-lock.json`
- `README.md`
- `docs/ATLAS_SPARK_BACKEND_MIGRATION.md`
- `docs/ATLAS_PHASE_12_FINAL_POLISH.md`

## Commands Run

- `npm install`
  - Passed.
  - Reported 27 moderate npm audit vulnerabilities.
  - Windows reported one cleanup warning for a locked generated `re2.node` file.
- `npm run typecheck --workspace=@atlas-ai/backend`
  - Passed.
- `npm run typecheck --workspace=apps/mobile`
  - Passed after removing the accidental root Zod 4 dependency.
- `npm ls zod --workspaces --depth=1`
  - Passed. Workspaces now resolve Zod 3 consistently.
- `npm run api:build`
  - Passed.
- `npm run typecheck --workspaces --if-present`
  - Passed for mobile, new backend, and legacy backend.
- `npm test --workspaces --if-present`
  - Passed. No tests were found in the active workspaces, and all scripts use `--passWithNoTests`.
- `npm run build --workspace=backend/api_legacy`
  - Passed.
- `Invoke-RestMethod http://localhost:3001/health`
  - Passed. Backend reported `firebasePlan: spark-compatible` and `aiProviderConfigured: false`.
- `npx expo start -c --web`
  - Passed after clearing Metro cache. Expo reported patch-version compatibility warnings for `expo` and `expo-router`.
- Browser verification at `http://localhost:8081/welcome`
  - Passed. Welcome rendered Atlas Core, brand copy, and CTAs.
- Browser verification at `http://localhost:8081/login`
  - Passed. Login screen rendered email/password form and navigation copy.
- `POST http://localhost:3001/api/mentor` without auth
  - Returned HTTP 401 as expected.

## Environment Variables

Mobile:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_ATLAS_API_BASE_URL`

Backend:

- `PORT`
- `NODE_ENV`
- `ALLOWED_ORIGINS`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

## Remaining Limitations

- Local AI endpoints require `FIREBASE_SERVICE_ACCOUNT_JSON` or Application Default Credentials.
- If `GEMINI_API_KEY` is missing, backend returns explicit offline fallback instead of fake AI output.
- Render free tier can cold start.
- The historical `functions/` folder still exists as archived code, but it is not in npm workspaces or Firebase deploy config.
- Older docs still mention previous phases that used Cloud Functions; new setup should follow this migration document and README.

## Verification Checklist

- Firebase Auth remains client-side through Firebase SDK.
- Firestore remains Spark-compatible.
- Mobile AI services no longer import `firebase/functions`.
- `firebase.json` no longer declares a Functions source or Functions emulator.
- Root `api` script starts `backend/api`, not `backend/api_legacy`.
- AI provider secrets remain backend-only.
