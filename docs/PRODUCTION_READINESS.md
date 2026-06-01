# AltasAI Production Readiness

## Ready-ish

- Active package structure is clear.
- Backend build, typecheck, tests, and model evaluation pass.
- Internal AltasAI AI runs before optional Gemini wording enhancement.
- CI workflow targets active workspaces.
- Firestore emulator tests are present.
- Python ML service trains, evaluates, and passes pytest locally.
- CI includes Node, Python, backend build, model evaluation, and audit checks.

## Not Production-Ready Yet

- Mobile UI needs real device E2E tests.
- Active core feature screens have been component/hook/style extracted; real device visual QA is still needed.
- App Check requires Firebase project setup.
- Sentry/Expo crash reporting requires credentials.
- Firestore rules tests need Java 21 locally.
- Recommendation model dataset is too small for production confidence.
- Load-test scripts exist, but they need real deployed services and auth tokens to produce launch-grade results.
- No real device E2E suite yet.

## Launch Checklist

- Enable App Check.
- Configure Sentry for mobile and backend.
- Run Firestore emulator tests in CI.
- Add Detox/Appium smoke tests.
- Add deployment environment validation.
- Add backup/restore process for Firestore.
- Add privacy policy and data retention policy.
- Run Python ML service as internal-only infrastructure.
