# AltasAI Codex Project Audit

Date: 2026-06-20

## Current Architecture

AltasAI is a monorepo with three active runtimes:

- `apps/mobile`: Expo Router React Native app with Firebase Auth, Firestore client data services, Zustand stores, React Query providers, local notifications, and dark productivity UI.
- `backend/api`: Express API that verifies Firebase ID tokens, applies rate limits/quotas, reads/writes Firestore with Admin SDK, runs deterministic AltasAI intelligence, optionally calls Gemini, and falls back when paid AI is unavailable.
- `backend/ml-service`: Python ML service with intent/entity/risk/recommendation/RAG/vision test fixtures and local model evaluation scripts.

Firebase data is user-scoped under `users/{uid}`. Client-writable core collections include profile, tasks, goals, daily logs, focus sessions, analytics, interventions status fields, and support modules. Server-owned AI collections are protected by Firestore rules.

## Detected Modules

- Auth/onboarding: login, registration, forgot password, onboarding, protected route resolution.
- Daily execution: home dashboard, tasks, task detail, focus sessions, proof submission, reflection.
- Planning: goals, milestones, AI/local breakdown fallback, milestone-to-task conversion.
- Mentor: chat UI, backend API client, secure mentor agent, offline fallback, subscription gating hooks.
- Analytics/reports: dashboard summaries, charts, daily/weekly reports, local calculations.
- Support modules: profile/settings, notifications, interventions, Cortex, security, digital, health, finance/khata, subscription, proof feed.
- Infrastructure: Firestore rules/indexes, Express backend, ML service, CI, seed data, setup docs.

## Broken Or Incomplete Areas

- Fixed: `expo-speech` was removed from Expo config plugins because the package does not provide a config plugin.
- Fixed: core visible UI copy in onboarding, task/goal modals, proof, mentor, reflection, common headers, and setup docs now uses AltasAI naming and ASCII-safe labels.
- Documented limitation: native Firebase Auth still uses in-memory persistence. The installed Firebase SDK exposes React Native persistence through conditional exports, but the current Metro/TypeScript setup does not import it cleanly without resolver churn.
- Fixed: profile editing now updates display name, focus areas, life rhythm, and discipline level with Firestore-safe defaults.
- Fixed: task edit/delete controls are available from task detail, task local-create fallback is deterministic, and carried-task summaries count `isCarried` and `status === 'carried'`.
- Fixed: goals now expose inline edit/delete/progress/complete controls and keep milestone-to-task conversion.
- Fixed: reflection feedback backend resolves both `YYYY-MM-DD` and `${uid}_YYYY-MM-DD` daily-log document IDs.
- Fixed: Android physical-device setup is documented in `.env.example`, `TESTING.md`, and `BACKEND_SETUP.md`.
- Fixed: seed data is emulator-only, expanded, and renamed to AltasAI.
- Remaining: `npm audit --audit-level=high` still fails with 58 advisories after Expo-compatible dependency updates. `npm audit fix` was attempted without `--force` and failed on npm peer-resolution conflicts; forced or legacy-peer remediation was not applied.

## Dependency And Config Issues

- Package manager: npm (`package-lock.json` present).
- Expo SDK: 54. App is Expo Router based and should remain Expo Go/dev-client compatible.
- `expo-doctor` blocker addressed by removing invalid `expo-speech` config plugin usage, updating Expo SDK-compatible speech/sharing packages, and restoring the Metro hierarchical lookup setting expected by Expo. `npx expo-doctor` now passes 18/18 checks.
- `npm audit --audit-level=high` reports advisories in transitive Expo/Firebase/Jest/Firebase-tools/backend dependencies. Do not use `npm audit fix --force` without validating breaking upgrades.

## Firebase Issues

- Client paths align with rules for `users/{uid}/profile/data`, `tasks`, `goals`, `dailyLogs`, `focusSessions`, and `analytics`.
- Firestore rules tests pass under Java 21.
- Backend reflection route resolves the actual mobile daily-log document ID and preserves the public response shape.
- App Check is implemented backend-side but disabled by env default; production setup remains credential/platform-gated.
- Firebase Storage/avatar upload is not implemented in the active profile flow; profile keeps initials-based avatar display.

## Navigation Issues

- Expo Router route files exist for auth and main tabs.
- Core protected routing is centralized through `resolveInitialRoute` and main layout redirects.
- Hidden secondary tabs are present; feature flags gate some modules but several secondary screens still need polish before production.
- Proof and subscription routes exist and are hidden from the tab bar.

## UI/UX Issues

- Core style is dark, glowing, and productivity-focused, but corrupted glyphs make several screens look broken.
- Profile settings now include editable controls for core profile fields.
- Proof flow copy uses AltasAI naming and ASCII-safe symbols.
- Some buttons use text where icon components already exist; keep fixes scoped to broken text/overflow rather than redesigning the app.

## Testing Gaps

- Existing unit/smoke tests pass but do not fully exercise screen interaction on a device.
- Added focused regression tests for reflection-feedback ID lookup, profile update defaults, carried-task summaries, task local-create fallback, and AI fallback contracts.
- Real Android QA is still manual; no Detox/Appium suite is configured.

## Priority Fix Plan

1. Review remaining audit advisories with an explicit Expo/Firebase/tooling upgrade plan.
2. Run manual Android physical-device QA with a LAN IP or tunnel backend URL.
3. Revisit native Firebase Auth persistence by enabling a clean conditional export path for `getReactNativePersistence`.
4. Clean unrelated lint warnings in finance/health/focus/report files when those modules are next touched.
