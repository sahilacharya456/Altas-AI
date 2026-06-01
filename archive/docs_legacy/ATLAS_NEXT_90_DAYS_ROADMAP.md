# Atlas AI Next 90 Days Roadmap

Date: 2026-05-28

## Goal

Move Atlas AI from demo-ready portfolio/FYP product to a credible private beta MVP.

## Weeks 1-2: Stabilize The Demo

Product:

- Prepare demo account and seeded data.
- Define the exact demo story: overload, carry loop, Cortex risk, intervention, focus, report.
- Remove or hide routes that are not needed for the demo.

Frontend:

- Screenshot QA for Welcome, Dashboard, Tasks, Focus, Cortex, Reports.
- Replace remaining garbled labels and weak copy.
- Add loading/empty/error states where missing.

AI:

- Verify callable Function auth and rate limits in emulator.
- Test offline fallback paths.

Cortex:

- Create deterministic seed data that triggers risk and interventions.
- Add an admin/demo rebuild script for Cortex if safe.

Security:

- Install JDK 21 and run Firestore rules tests.
- Enable repository secret scanning.

Testing:

- Add mobile service tests for tasks, goals, behavior events.

Launch:

- Record a 3-minute demo video.
- Capture first README screenshots.

## Weeks 3-4: Finish Command OS UI Migration

Frontend:

- Migrate Health to Atlas Command OS.
- Migrate Digital to Atlas Command OS.
- Migrate Finance/Khata subflows.
- Migrate Security subflows.
- Remove high-glow/neon legacy styling.
- Replace `@ts-nocheck` in analytics, health, digital, budget insights.

Product:

- Make News clearly optional/lab-only.
- Improve Profile, Settings, and Privacy flows.

Testing:

- Add UI smoke tests for main tabs.
- Add screenshot checks for the demo path.

## Weeks 5-6: Cortex V2

Cortex:

- Add trend confidence.
- Add personalized execution window.
- Add weekly pattern scoring.
- Add cross-module signal weights.
- Add stale-signal detection.

Interventions:

- Add notification delivery for active interventions.
- Add accept actions beyond task creation.
- Add suppression logic for ignored interventions.

AI:

- Add AI wording only after deterministic rule detection.
- Add structured logging for provider/offline status without prompt leakage.

## Weeks 7-8: Production Security Foundation

Security:

- Configure Firebase App Check.
- Add Crashlytics.
- Add Firebase Analytics.
- Add AI usage monitoring.
- Add abuse alerts for rate-limit pressure.
- Review Firestore indexes for all production queries.

Privacy:

- Implement AI memory control.
- Implement data export request flow.
- Implement delete data request flow.
- Add privacy screen with plain-language explanations.

Testing:

- Run Firestore rules tests in CI.
- Add rules tests for reports, conversations, behavior events, interventions.

## Weeks 9-10: Reports And Premium Value

Reports:

- Improve weekly report detail.
- Add chart polish.
- Add report export/share placeholder replacement.
- Add monthly deterministic summary.

AI:

- Improve report agent prompt quality.
- Add report schema tests for malformed model outputs.

Product:

- Define Pro/Premium feature boundaries.
- Add pricing hypothesis.

## Weeks 11-12: Beta Preparation

Frontend:

- Final mobile layout QA.
- Web QA if React Native Web remains supported.
- Fix all critical visual overlap issues.

Backend:

- Deploy Firebase Functions to staging.
- Verify callable Functions with staging Firebase project.
- Verify rate limits and logs.

Testing:

- End-to-end demo checklist.
- Regression checklist.
- Device testing on Android and iOS if available.

Portfolio/LinkedIn:

- Final README screenshots.
- Architecture diagram.
- 3-minute demo video.
- FYP presentation deck.
- LinkedIn launch post.
- Resume bullet points.

## Product Tasks

- Define target user and premium positioning.
- Decide what belongs in v1 and what stays lab.
- Create seed/demo scenarios.
- Write onboarding copy that explains privacy and discipline mode.

## Frontend Tasks

- Complete Atlas Command OS migration.
- Remove `@ts-nocheck`.
- Add smoke tests.
- Add screenshot QA.
- Improve Profile/Settings/Privacy.

## AI Tasks

- Harden gateway output validation.
- Add provider cost monitoring.
- Add better prompt tests.
- Improve offline fallback copy.

## Cortex Tasks

- Trend confidence.
- Execution window.
- Behavior event quality scoring.
- Backfill/rebuild tooling.

## Security Tasks

- App Check.
- Crashlytics.
- Analytics.
- Secret scanning.
- Rules tests in CI.
- Privacy controls.

## Testing Tasks

- Service tests.
- Rules tests.
- UI smoke tests.
- Demo path regression.
- Functions agent tests.

## Launch Tasks

- Demo data.
- Screenshots.
- README polish.
- Demo video.
- FYP deck.
- LinkedIn post.
- Portfolio case study.
