# AltasAI Firebase Setup

## Mobile Web Config

Create `apps/mobile/.env` from `apps/mobile/.env.example` and fill the Firebase web app values:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

Do not add Gemini, Stripe secret, Firebase Admin, or service-account values to mobile env files. Mobile calls the backend for AI and billing.

## Backend Admin Config

Create `backend/api/.env` from `backend/api/.env.example`.

For local emulator work:

```bash
FIREBASE_PROJECT_ID=altasai-emulator
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
```

For a real Firebase project, use Application Default Credentials or a service account on the backend only. Keep `FIREBASE_SERVICE_ACCOUNT_JSON` empty unless the deployment platform requires a single-line JSON env var.

## Firestore Shape

The mobile app reads and writes user-owned data under:

- `users/{uid}/profile/data`
- `users/{uid}/tasks/{taskId}`
- `users/{uid}/goals/{goalId}`
- `users/{uid}/dailyLogs/{uid}_YYYY-MM-DD`
- `users/{uid}/focusSessions/{sessionId}`
- `users/{uid}/conversations/{conversationId}`

The backend `POST /api/reflection-feedback` accepts `{ "date": "YYYY-MM-DD" }` and resolves both `YYYY-MM-DD` and `{uid}_YYYY-MM-DD` daily-log IDs.

## Auth Persistence

Firebase env validation remains enabled and missing config produces a safe local-demo warning instead of exposing secrets.

Native Firebase Auth currently initializes with in-memory persistence. The installed Firebase SDK includes a React Native `getReactNativePersistence` helper through its React Native conditional export, and `@react-native-async-storage/async-storage` is already installed. This repo's current Metro config disables package exports, so importing that helper cleanly through TypeScript/Metro is not stable yet. The limitation is that native sign-in may not persist across app restarts until this resolver configuration is revisited.

Do not add native-only auth packages that break Expo Go.

## App Check

`REQUIRE_APP_CHECK=false` is the local default. Turn it on only after Firebase App Check providers are configured for the mobile app and the backend verifies valid App Check tokens.

## Storage And Avatars

Profile editing currently supports text fields and keeps avatars as initials. Firebase Storage and image upload are not implemented.
