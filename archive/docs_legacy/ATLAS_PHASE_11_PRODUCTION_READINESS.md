# Atlas AI Phase 11: Testing, Rules, and Production Readiness

## Goal

Move Atlas AI closer to production readiness by improving tests, Firestore rules, emulator support, CI, App Check planning, and monitoring documentation.

## Tests Added

Added function unit tests:

- `functions/src/ai/schemas.test.ts`
- `functions/src/ai/modelRouter.test.ts`
- `functions/src/cortex.test.ts`
- `functions/src/interventionEngine.test.ts`

Coverage added:

- AI schema fallback behavior
- OpenAI placeholder routing to offline fallback
- Offline provider behavior
- Cortex deterministic risk-level mapping
- Cortex recommended-action selection
- Intervention overload severity helper

Existing emulator rules tests were expanded:

- `functions/src/firestore.test.ts`

Rules test coverage added:

- valid health log writes
- invalid health log rejection
- valid digital usage writes
- invalid digital category rejection
- valid budget writes
- spoofed budget `userId` rejection
- report client-write lockdown
- report owner-read access

Important: Firestore rules tests require the Firebase emulator and JDK 21. They were added and kept available, but local emulator execution failed on this machine because Java is older than 21.

## Test Scripts

Updated:

- `functions/package.json`

Scripts now separate fast unit tests from emulator rules tests:

```text
npm test --workspace=functions
npm run test:rules --workspace=functions
```

Root workspace test command remains:

```text
npm test --workspaces --if-present
```

This keeps normal CI/unit validation usable even when a local machine cannot start Firebase emulators.

## Firebase Emulator Support

Existing emulator config was found in `firebase.json`:

- Functions: `5001`
- Firestore: `8080`
- Auth: `9099`
- Emulator UI: `4000`

Added demo seed script:

- `scripts/seed-demo-data.js`

Root script:

```text
npm run emulator:seed
```

The seed script refuses to run unless `FIRESTORE_EMULATOR_HOST` is set, so it cannot accidentally write to production Firestore.

JDK requirement:

- Firebase Tools now requires Java 21+ for emulator execution.
- Current local validation failed until JDK 21 is installed/configured.

## Firestore Rules Improved

Updated:

- `firestore.rules`

Strengthened validation for:

- tasks
- goals
- daily logs
- expenses
- khata
- budgets
- health logs
- digital usage
- behavior events
- interventions
- reports

Rules improvements:

- User-scoped writes now validate `request.resource.data.userId == userId` for key collections.
- Health logs validate sleep, water, workout, energy, routine score, stress, and notes bounds.
- Digital usage validates screen minutes, goal minutes, exceeded flag, distraction score, app category, and notes bounds.
- Budgets validate user ownership, month, total budget, and spent values.
- Reports remain owner-readable and client-write denied.
- Conversations and AI feedback remain server-written only.
- Deny-all fallback remains.

Server-only collections remain client-inaccessible:

- `aiFeedback`
- `ai_parse_errors`
- `rateLimits`
- `reports` writes
- `conversations` writes
- `cortex` writes
- `ai_cortex_state` writes

## CI Added

Added:

- `.github/workflows/ci.yml`

CI steps:

- checkout
- set up Node 20
- set up Java 21 for Firebase emulators
- `npm ci`
- workspace typecheck
- functions build
- workspace tests
- Firestore rules tests
- secret scanning recommendation notice

Secret scanning is documented as a required production control, but not faked as implemented. GitHub secret scanning/push protection or an explicit tool such as Gitleaks/TruffleHog should be enabled in the repository settings.

## App Check Plan

App Check was not faked or marked configured.

Production TODOs:

- Enable Firebase App Check for the Expo app through a supported production provider.
- Enforce App Check for callable Cloud Functions after verifying mobile compatibility.
- Enforce App Check for Firestore once rollout telemetry is clean.
- Add a staged rollout with debug tokens for development and CI.
- Document App Check recovery procedure for blocked legitimate users.

App Check should be treated as a production gate, not a cosmetic config flag.

## Monitoring Readiness

Required production monitoring plan:

- Crash reporting: add Sentry or Firebase Crashlytics-compatible mobile crash reporting.
- Product analytics: track command briefing opens, task starts/completions, focus sessions, intervention actions, report generation, and security scans.
- Function logs: monitor callable error rates, latency, fallback rate, and rate-limit denials.
- AI usage monitoring: track provider, offline fallback, token/response failure estimates, parse failures, and agent type.
- Abuse/rate limits: keep callable rate limits and add per-user/day AI usage budgets before public launch.
- Security monitoring: alert on repeated high-risk scans, unusual callable traffic, and rules-denied spikes.

## Files Changed

- `.github/workflows/ci.yml`
- `firestore.rules`
- `functions/package.json`
- `functions/src/ai/modelRouter.test.ts`
- `functions/src/ai/schemas.test.ts`
- `functions/src/cortex.test.ts`
- `functions/src/cortex.ts`
- `functions/src/firestore.test.ts`
- `functions/src/interventionEngine.test.ts`
- `functions/src/interventionEngine.ts`
- `package.json`
- `scripts/seed-demo-data.js`
- `docs/ATLAS_PHASE_11_PRODUCTION_READINESS.md`

## Commands Run

```text
npm run build --workspace=functions
```

Result: passed.

```text
npm run typecheck --workspaces --if-present
```

Result: passed.

```text
npm test --workspaces --if-present
```

Initial result: failed because the old functions test script always launched Firestore emulators and local Java is below version 21.

Fix: split function tests into unit tests and emulator rules tests.

Final result: passed.

```text
npm run test:rules --workspace=functions
```

Result: failed locally before tests could run.

Reason:

```text
firebase-tools no longer supports Java version before 21.
```

This is an environment blocker, not a TypeScript/build failure. CI installs Java 21 before running rules tests.

## Production Blockers

- JDK 21 must be installed locally and in CI for emulator rules validation.
- App Check is not configured or enforced yet.
- Crash reporting is not configured.
- Secret scanning is recommended but not enforced in repository settings from code.
- Mobile UI smoke tests are still minimal; Expo/RN test harness should be added carefully.
- Some support-module behavior events are still client-emitted; critical signals should move to Cloud Functions.
- Firestore rules should be validated in CI with emulator before launch.
- AI usage budgets need daily/monthly limits beyond the current per-minute callable rate limiter.

## Exact Launch Checklist

1. Install JDK 21 and verify `java -version`.
2. Run `npm run test:rules --workspace=functions`.
3. Enable GitHub secret scanning and push protection.
4. Configure Firebase App Check in monitor mode.
5. Move App Check enforcement to Functions first, then Firestore after clean telemetry.
6. Add crash reporting and production error alerting.
7. Configure AI usage dashboards and alert thresholds.
8. Add production Firebase indexes from emulator/console recommendations.
9. Run full validation:

```text
npm run typecheck --workspaces --if-present
npm run build --workspace=functions
npm test --workspaces --if-present
npm run test:rules --workspace=functions
```

10. Deploy to a staging Firebase project before production.
11. Run manual smoke tests for auth, dashboard, tasks, goals, Cortex, interventions, reports, finance, health, digital, and security.
12. Deploy production only after staging telemetry is clean.
