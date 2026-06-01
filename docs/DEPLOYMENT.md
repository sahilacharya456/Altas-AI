# AltasAI Deployment

## Mobile

AltasAI mobile is an Expo app in `apps/mobile`.

Required production configuration:

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_ALTASAI_API_BASE_URL`

Do not put server secrets in Expo public environment variables.

Recommended validation:

```bash
npm run typecheck --workspace=@altasai/mobile
npm test --workspace=@altasai/mobile
```

Native release should use EAS Build after project credentials, app icon, splash, Android package, and iOS bundle identifiers are verified.

## TypeScript Backend

Backend lives in `backend/api`.

Required production variables:

- `PORT`
- `NODE_ENV=production`
- `ALLOWED_ORIGINS`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- `ML_SERVICE_BASE_URL`
- `ML_SERVICE_TIMEOUT_MS`
- optional `GEMINI_API_KEY`
- optional `GEMINI_MODEL`
- `AI_DAILY_QUOTA`

Validation:

```bash
npm run typecheck --workspace=@altasai/backend
npm test --workspace=@altasai/backend
npm run build --workspace=@altasai/backend
```

## Python ML Service

ML service lives in `backend/ml-service`.

Deploy it as an internal service. Do not expose it publicly without auth and network controls.

Validation:

```bash
pip install -r backend/ml-service/requirements.txt
npm run ml:train
npm run ml:evaluate
npm run ml:test
```

## Firebase

Deploy Firestore rules and indexes:

```bash
npx firebase deploy --only firestore:rules,firestore:indexes --project altasai
```

Before launch, run Firestore emulator tests with Java 21+:

```bash
npm run test:rules --workspace=@altasai/backend
```
