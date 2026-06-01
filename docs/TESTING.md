# AltasAI Testing

Run from the workspace root.

```bash
npm run typecheck --workspaces --if-present
npm test --workspaces --if-present
npm run build --workspace=@altasai/backend
npm run evaluate:altasai --workspace=@altasai/backend
npm run ml:train
npm run ml:evaluate
npm run ml:test
npm audit --audit-level=high
```

Firestore rules tests require Java 21+:

```bash
npm run test:rules --workspace=@altasai/backend
```

## Backend Coverage

- Auth failure and protected route behavior
- Mentor fallback when external AI wording is unavailable
- Quota/rate-limit behavior
- Cortex and security routes
- Intent classification
- Entity extraction
- Reflection sentiment/theme analysis
- Productivity pattern detection
- User state vector
- Deadline risk scoring
- Focus prediction
- Burnout/overload risk
- Goal progress prediction
- Habit consistency
- Finance, health, security, anomaly models
- Cortex insight generation
- Report insight generation
- Safety guardrails

## Mobile Coverage

- Protected route resolution
- Onboarding completion state
- Dashboard-ready state
- Task create/complete smoke state
- Focus start/stop smoke state
- Reflection validation/success state
- Mentor fallback smoke state
- Report empty/generated state
- Profile save state
- Product event buffering for startup metrics

These are smoke-contract tests, not full device E2E tests.

## Model Evaluation

`npm run evaluate:altasai --workspace=@altasai/backend` runs dataset-backed metrics:

- intent accuracy threshold: `0.80`
- entity extraction threshold: `0.75`
- reflection threshold: `0.75`
- recommendation top-3 threshold: `0.80`
- risk bucket threshold: `0.75`
- report completeness threshold: `0.85`
- safety threshold: `0.90`

The runner exits non-zero if any threshold fails.

`npm run ml:evaluate` runs the Python ML service evaluation for trained intent, entities, risk, recommendation, RAG, safety, and vision adapters.

## Latest Local Verification - 2026-06-01

Passed:

- `npm run typecheck --workspaces --if-present`
- `npm test --workspaces --if-present` (`13` mobile tests, `25` backend tests, Firestore emulator suite skipped inside Jest)
- `npm run build --workspace=@altasai/backend`
- `npm run evaluate:altasai --workspace=@altasai/backend`
- `npm run ml:evaluate`
- `npm run ml:test`
- `npm audit --audit-level=high`

Blocked locally:

- `npm run test:rules --workspace=@altasai/backend` fails because this machine has Java 17 and `firebase-tools` requires Java 21+.

Security note: the audit gate passes at high severity, but `npm audit` still reports moderate transitive advisories in Expo/Firebase/tooling packages. These should be addressed during the Expo/Firebase upgrade window.

## Production Gaps

- Add React Native Testing Library screen tests.
- Add Detox/Appium E2E flows for real navigation and Firebase emulator data.
- Run Firestore emulator tests in CI and locally with Java 21.
- Add load tests for AI endpoints and rate limits.
