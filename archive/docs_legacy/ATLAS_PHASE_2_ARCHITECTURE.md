# Atlas AI Phase 2 Architecture Report

Date: 2026-05-27  
Phase: Architecture Restructuring

## Goal

Restructure Atlas AI toward a clean Firebase-first architecture without redesigning UI or changing the product surface. The target product loop remains:

`Signals -> Cortex -> Insight -> Intervention -> Execution -> Report`

## Old Structure Problems

- Expo Router screens in `apps/mobile/app` are large and contain mixed UI, navigation, data loading, and feature logic.
- `apps/mobile/src/components` only had `auth`, `common`, and `ui`, so future layout/card/form/chart/feedback reuse had no clear ownership.
- Domain code existed mostly under `services/data` and `stores`, but there was no feature boundary for auth, command, execute, tasks, goals, mentor, cortex, reflection, finance, health, digital, security, or profile.
- Mobile Firestore types were mostly centralized, but Phase 2 product primitives were missing: `BehaviorEvent`, `CortexSummary`, `Intervention`, and `AIReport`.
- Firebase Functions were implemented as flat files in `functions/src`. This worked, but it did not express future domains such as `ai`, `mentor`, `cortex`, `triggers`, `interventions`, and `reports`.
- Hardcoded route strings existed in obvious navigation spots.
- `backend/api_legacy` remains structurally separate from Firebase and should stay legacy/admin-experimental, not mobile production architecture.

## New Structure Added

Mobile architecture scaffolding now supports:

```text
apps/mobile/src/
  components/
    common/
    layout/
    cards/
    forms/
    charts/
    feedback/
  features/
    auth/
    command/
    execute/
    tasks/
    goals/
    mentor/
    cortex/
    reflection/
    finance/
    health/
    digital/
    security/
    profile/
  services/
    firebase/
    ai/
    data/
    security/
  stores/
  hooks/
  constants/
  theme/
  utils/
  types/
```

Important implementation choice: route files in `apps/mobile/app` were not moved. Expo Router depends on file placement, and moving screens would be high-risk without a dedicated navigation migration phase.

Functions architecture now supports:

```text
functions/src/
  index.ts
  shared/
  ai/
  cortex/
  mentor/
  goals/
  reflections/
  budget/
  interventions/
  reports/
  triggers/
```

Implementation files such as `chat.ts`, `goals.ts`, `reflections.ts`, `budget.ts`, and `cortex.ts` remain in place for compatibility. New domain folders re-export existing functions safely.

## Files Changed

Mobile:

- `apps/mobile/app/(auth)/login.tsx`
- `apps/mobile/app/(auth)/onboarding.tsx`
- `apps/mobile/app/(auth)/register.tsx`
- `apps/mobile/app/(auth)/welcome.tsx`
- `apps/mobile/app/(main)/index.tsx`
- `apps/mobile/app/(main)/khata.tsx`
- `apps/mobile/app/(main)/profile.tsx`
- `apps/mobile/app/(main)/security.tsx`
- `apps/mobile/src/components/cards/index.ts`
- `apps/mobile/src/components/charts/index.ts`
- `apps/mobile/src/components/feedback/index.ts`
- `apps/mobile/src/components/forms/index.ts`
- `apps/mobile/src/components/layout/index.ts`
- `apps/mobile/src/features/auth/index.ts`
- `apps/mobile/src/features/command/index.ts`
- `apps/mobile/src/features/cortex/index.ts`
- `apps/mobile/src/features/digital/index.ts`
- `apps/mobile/src/features/execute/index.ts`
- `apps/mobile/src/features/finance/index.ts`
- `apps/mobile/src/features/goals/index.ts`
- `apps/mobile/src/features/health/index.ts`
- `apps/mobile/src/features/mentor/index.ts`
- `apps/mobile/src/features/profile/index.ts`
- `apps/mobile/src/features/reflection/index.ts`
- `apps/mobile/src/features/security/index.ts`
- `apps/mobile/src/features/tasks/index.ts`
- `apps/mobile/src/hooks/index.ts`
- `apps/mobile/src/types/firestore.ts`
- `apps/mobile/src/types/index.ts`

Functions:

- `functions/src/ai/index.ts`
- `functions/src/budget/index.ts`
- `functions/src/cortex/index.ts`
- `functions/src/goals/index.ts`
- `functions/src/index.ts`
- `functions/src/interventions/index.ts`
- `functions/src/mentor/index.ts`
- `functions/src/reflections/index.ts`
- `functions/src/reports/index.ts`
- `functions/src/shared.ts`
- `functions/src/shared/types.ts`
- `functions/src/triggers/index.ts`

Documentation:

- `docs/ATLAS_PHASE_2_ARCHITECTURE.md`

## Type System Changes

Added or confirmed shared mobile types for:

- `UserProfile`
- `Task`
- `Goal`
- `DailyLog`
- `Expense`
- `KhataEntry`
- `HealthLog`
- `DigitalUsage`
- `SecurityEvent`
- `BehaviorEvent`
- `CortexSummary`
- `Intervention`
- `AIReport`

Functions type definitions for behavior patterns, budget insights, cortex state, interventions, and AI reports now live under `functions/src/shared/types.ts` and are re-exported from `functions/src/shared.ts`.

## Route Constants

Centralized route constants already existed from Phase 1 and were expanded in use during Phase 2. Replaced obvious hardcoded route strings in:

- auth welcome/login/register/onboarding flows
- dashboard quick actions
- Khata navigation
- profile logout/settings navigation
- security clipboard scan navigation

Remaining dynamic route pushes still use `as any` where screen code passes routes dynamically. These should be reduced when route ownership is moved into feature modules.

## Backend Strategy

Firebase remains the production backend:

- Firebase Auth
- Firestore
- Firebase Cloud Functions

`backend/api_legacy` was inspected but not moved in this phase. It remains a legacy/admin-experimental backend and is documented in `docs/ATLAS_BACKEND_STRATEGY.md`. No new mobile dependency on the legacy backend was added.

## Remaining Technical Debt

- Large route screens still need decomposition into feature components and hooks.
- `apps/mobile/src/services/api_legacy` still exists as legacy reference code and should be archived or removed after Firebase parity is confirmed.
- Firestore rules still need Phase 3 hardening for security service write paths, health, digital usage, analytics, budgets, and profile.
- Functions implementations are still physically flat. New domain folders re-export safely, but a later phase can move files once tests cover deployed function names.
- Component folders now exist, but many components still import directly from `common` or `ui`.
- The Cortex type model exists, but the full Signals -> Cortex -> Intervention -> Report engine is not implemented yet.

## Commands Run

- `Get-ChildItem -Recurse -Depth 3 apps\mobile\app,apps\mobile\src,functions\src,backend\api_legacy`
- `rg --files apps\mobile\app apps\mobile\src functions\src backend\api_legacy firestore.rules`
- `Get-Content` reads for mobile types, route constants, Functions shared code, Functions index, and Firestore rules
- Route scans with `rg -n 'router\.(push|replace)\('`
- `npm run typecheck --workspaces --if-present`
- `npm run build --workspace=functions`
- `npm run typecheck --workspace=apps/mobile`

## Validation Results

- `npm run typecheck --workspaces --if-present`: passed.
- `npm run build --workspace=functions`: passed.
- `npm run typecheck --workspace=apps/mobile`: passed.

## Phase 3 Should Do

1. Harden Firestore rules and add emulator tests for every production collection.
2. Move repeated screen logic into feature-owned hooks.
3. Start decomposing the largest route screens without changing UI.
4. Add server-side `BehaviorEvent` writes for tasks, reflection, security, finance, health, and digital usage.
5. Expand Cortex from summary context into a real event-driven intelligence layer.
6. Define first-class `Intervention` and `AIReport` Firestore collections before building the AI engine.
