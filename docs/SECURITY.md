# AltasAI Security

## Current Controls

- Backend verifies Firebase ID tokens with Firebase Admin.
- Mobile client does not store backend API secrets.
- Express backend uses Helmet, CORS allowlist, rate limiting, request IDs, and structured logs.
- Firestore rules enforce user ownership across user subcollections.
- Server-owned AI collections block client writes.
- Backend API can enforce Firebase App Check with `REQUIRE_APP_CHECK=true` and the `X-Firebase-AppCheck` header.
- Admin metrics/stats endpoints are token-protected with `ADMIN_METRICS_TOKEN`.
- Safety guardrail blocks offensive cybersecurity help and bounds medical/wellbeing guidance.

## Firebase App Check

Repository-side App Check verification exists, but full App Check is not complete until Firebase Console/platform setup is done. Production launch should enable:

- Play Integrity for Android
- DeviceCheck/App Attest for iOS
- App Check enforcement on Firestore and callable/API entry points where applicable
- backend verification for App Check tokens by setting `REQUIRE_APP_CHECK=true`

## Secrets

Use environment variables only. Do not put Gemini, Firebase Admin, Sentry, or other secrets in Expo public variables.

## Remaining Gaps

- Add secret scanning in GitHub.
- Run Firestore rules tests with Java 21.
- Configure App Check providers/debug tokens in Firebase Console.
- Add production WAF/API gateway controls if deployed publicly.
