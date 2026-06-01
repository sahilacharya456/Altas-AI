# AltasAI Launch Checklist

## Required Before Public Launch

- Put the workspace under Git and review all changes.
- Run all checks from `docs/TESTING.md`.
- Install Java 21 and run Firestore emulator rules tests.
- Configure Firebase App Check for Android, iOS, and Web targets.
- Configure Sentry or equivalent crash reporting.
- Configure backend log forwarding and alerting.
- Set production `ALLOWED_ORIGINS`.
- Set production `EXPO_PUBLIC_ALTASAI_API_BASE_URL`.
- Deploy backend API behind HTTPS.
- Deploy Python ML service as an internal-only service.
- Verify mobile app icon, splash screen, package name, bundle identifier, and store metadata.
- Expand model datasets beyond seed samples.
- Add real device E2E tests before store submission.

## Current Launch Status

Production-close, not production-launched.

Blocking items:

- Firestore emulator tests could not run locally without Java 21.
- Mobile E2E tests are not implemented.
- ML datasets are small seed datasets.
- App Check and crash reporting require project credentials.
