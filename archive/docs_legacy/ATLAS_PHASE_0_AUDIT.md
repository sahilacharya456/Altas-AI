# Atlas AI Phase 0 Audit

Date: 2026-05-27  
Workspace: `C:\Users\sahil\Desktop\ALTAS_AI`

## Executive Summary

Atlas AI is currently a Firebase-first Expo React Native app with a parallel legacy Express/MongoDB backend. The mobile app has real Firebase Auth, Firestore data services, Zustand stores, Cloud Functions callables, and many product screens. It is not just a todo app in structure, but the intelligence loop is still incomplete: signals exist across tasks, goals, reflection, finance, digital usage, health, and security, while Cortex/AI intervention/reporting is only partially wired.

The core product direction should remain:

`Signals -> Cortex -> Insight -> Intervention -> Execution -> Report`

The most important Phase 1 priority is to make Firebase the single production path for auth, user data, and AI calls, then isolate or archive the legacy Express API so it cannot interfere with the Firebase-first app.

## Current Architecture Summary

- Mobile app: `apps/mobile`
  - Expo Router, React Native, TypeScript.
  - Firebase Auth and Firestore are the active production data layer.
  - Zustand stores manage auth, tasks, goals, analytics, and toasts.
  - TanStack React Query is configured globally but is not the dominant data layer yet.
  - React Hook Form and Zod are used in auth forms.
  - Reanimated and custom UI components drive the current visual system.
- Firebase backend: `functions`
  - Cloud Functions callable AI endpoints and Firestore triggers.
  - Gemini calls are server-side in Functions.
  - Firestore security rules exist and are mostly user-scoped.
- Legacy backend: `backend/api_legacy`
  - Express, MongoDB/Mongoose, JWT auth, Gemini/OpenAI config.
  - Has modules for auth, tasks, mentor, reflection, analytics.
  - Still reachable from mobile AI service and has a public `/api/chat` endpoint.
- Data model:
  - Primary Firestore structure is per-user subcollections under `users/{uid}`.
  - Legacy MongoDB has separate User, Task, Conversation, Reflection models.

## Current Module Map

### Mobile Screens

- Auth/welcome/onboarding:
  - `apps/mobile/app/(auth)/welcome.tsx`
  - `apps/mobile/app/(auth)/login.tsx`
  - `apps/mobile/app/(auth)/register.tsx`
  - `apps/mobile/app/(auth)/onboarding.tsx`
- Dashboard:
  - `apps/mobile/app/(main)/index.tsx`
- Tasks:
  - `apps/mobile/app/(main)/tasks.tsx`
  - `apps/mobile/src/stores/tasksStore.ts`
  - `apps/mobile/src/services/data/tasks.ts`
- Goals:
  - `apps/mobile/app/(main)/goals.tsx`
  - `apps/mobile/src/stores/goalsStore.ts`
  - `apps/mobile/src/services/data/goals.ts`
- AI Mentor:
  - `apps/mobile/app/(main)/mentor.tsx`
  - `apps/mobile/src/services/ai/mentor.ts`
- Cortex / behavior intelligence:
  - `apps/mobile/src/services/data/intelligence.ts`
  - `apps/mobile/src/services/data/moodAdaptor.ts`
  - `functions/src/cortex.ts`
  - `functions/src/chat.ts`
- Reflection:
  - `apps/mobile/app/(main)/reflection.tsx`
  - `apps/mobile/src/services/data/dailyLogs.ts`
- Analytics:
  - `apps/mobile/app/(main)/analytics.tsx`
  - `apps/mobile/src/stores/analyticsStore.ts`
  - `apps/mobile/src/services/data/analytics.ts`
- Khata / finance:
  - `apps/mobile/app/(main)/khata.tsx`
  - `apps/mobile/app/(main)/add-expense.tsx`
  - `apps/mobile/app/(main)/expense-history.tsx`
  - `apps/mobile/app/(main)/ledger.tsx`
  - `apps/mobile/app/(main)/budget-insights.tsx`
  - `apps/mobile/src/services/data/expenses.ts`
  - `apps/mobile/src/services/data/khata.ts`
  - `apps/mobile/src/services/data/budget.ts`
- Digital usage:
  - `apps/mobile/app/(main)/digital.tsx`
  - `apps/mobile/src/services/data/digitalUsage.ts`
- Health:
  - `apps/mobile/app/(main)/health.tsx`
  - `apps/mobile/src/services/data/health.ts`
- Security / Shield:
  - `apps/mobile/app/(main)/security.tsx`
  - `apps/mobile/app/(main)/scan-link.tsx`
  - `apps/mobile/app/(main)/device-safety.tsx`
  - `apps/mobile/src/services/data/security.ts`
  - `apps/mobile/src/services/security/*`
- Profile/settings:
  - `apps/mobile/app/(main)/profile.tsx`
  - `apps/mobile/src/services/data/profile.ts`
- News:
  - `apps/mobile/app/(main)/news.tsx`
- Notifications:
  - `apps/mobile/src/services/notifications/index.ts`

### Mobile Stores

- `authStore.ts`: Firebase auth and profile subscription.
- `tasksStore.ts`: today's task subscription, task CRUD, notifications.
- `goalsStore.ts`: active goal subscription and AI breakdown call.
- `analyticsStore.ts`: dashboard and chart aggregation.
- `toastStore.ts`: local toast state.

### Mobile Service Layers

- `services/firebase`: Firebase config, auth, Firestore helpers.
- `services/data`: Firestore domain services.
- `services/ai`: AI mentor client wrapper.
- `services/api_legacy`: legacy Express API client.
- `services/security`: local security heuristics and Firestore writes.
- `services/notifications`: local notification scheduling.

## Current Backend Map

### Firebase Functions

- `chatWithMentor`: authenticated callable mentor chat.
- `generateGoalBreakdown`: authenticated callable goal milestone generator.
- `generateReflectionFeedback`: authenticated callable reflection feedback.
- `analyzeBudgetDiscipline`: authenticated callable budget insight generator.
- `onTaskWrite`: Firestore trigger rebuilding Cortex.
- `onGoalWrite`: Firestore trigger rebuilding Cortex.
- `onDailyLogWrite`: Firestore trigger rebuilding Cortex.
- `testCortexRebuild`: exported helper, not a deployed trigger by itself.

### Legacy Express API

- Public:
  - `GET /health`
  - `POST /api/chat`
- Versioned API prefix:
  - `/api/v1/auth`
  - `/api/v1/tasks`
  - `/api/v1/mentor`
  - `/api/v1/reflection`
  - `/api/v1/analytics`
- Commented future modules:
  - goals, health, digital, career, security.

## Current Firestore Collection Map

Active rules/data paths:

- `users/{uid}/profile/{document}`
- `users/{uid}/tasks/{taskId}`
- `users/{uid}/goals/{goalId}`
- `users/{uid}/dailyLogs/{logId}`
- `users/{uid}/conversations/{conversationId}`
- `users/{uid}/ai_cortex_state`
- `users/{uid}/analytics/{document}`
- `users/{uid}/securityEvents/{eventId}`
- `users/{uid}/securityScans/{scanId}`
- `users/{uid}/linkAnalysis/{analysisId}`
- `users/{uid}/digitalUsage/{usageId}`
- `users/{uid}/healthLogs/{logId}`
- `users/{uid}/expenses/{expenseId}`
- `users/{uid}/khata/{entryId}`
- `users/{uid}/budgets/{budgetId}`
- `users/{uid}/budgetAlerts/{alertId}`
- `users/{uid}/aiFeedback/{feedbackId}`
- `ai_parse_errors/{errorId}`
- `rateLimits/{docId}`

Client code also attempts writes to paths that are not allowed by current rules:

- `users/{uid}/wifiSecurityEvents/{eventId}`
- `users/{uid}/deviceRiskReports/{reportId}`
- `users/{uid}/cyberDisciplineLogs/{logId}`

Risk: these security feature writes will fail in production unless rules and product data model are aligned.

## Problems Found

| Risk | Area | Finding | Evidence | Recommendation |
|---|---|---|---|---|
| Critical | AI architecture | Mobile mentor flow still tries legacy API and public `/api/chat` before Firebase callable. This violates Firebase-first direction and creates two AI authority paths. | `apps/mobile/src/services/ai/mentor.ts`, `backend/api_legacy/src/app.ts` | Phase 1 should make Firebase callable the primary production path and remove/protect public fallback from production builds. |
| Critical | Legacy backend | Public `/api/chat` accepts `systemContext` from request body and calls Gemini without auth. | `backend/api_legacy/src/app.ts` | Remove, require auth, or dev-gate this endpoint. Never accept trusted context directly from unauthenticated clients. |
| High | Firestore rules mismatch | Security services write to collections not present in rules. | `wifiSecurityEvents`, `deviceRiskReports`, `cyberDisciplineLogs` | Consolidate into `securityEvents`, `securityScans`, `linkAnalysis`, or add strict rules for the missing collections. |
| High | Duplicated data systems | Firebase and MongoDB both implement auth/tasks/mentor/reflection/analytics. | `apps/mobile/src/services/data/*`, `backend/api_legacy/src/modules/*` | Declare legacy backend read-only/dev-only or archive it after migration. |
| High | AI context trust | Mobile `chatWithMentor` accepts optional `systemContext` and can forward it to server paths. | `apps/mobile/src/services/ai/mentor.ts`, `functions/src/chat.ts` | Server should build context from Firestore only. Client-provided `systemContext` should be removed or ignored in production. |
| Medium | Cortex quality | Cortex state is a useful start but mostly task/reflection/goal focused. Finance, health, digital usage, and security are not fully integrated. | `functions/src/cortex.ts` | Expand Cortex schema after stabilizing Firestore contracts. |
| Medium | Analytics correctness | Analytics appears to calculate from client-side service functions and may silently fail in stores. | `analyticsStore.ts`, `services/data/analytics.ts` | Move authoritative analytics snapshots to Cloud Functions. |
| Medium | Error handling | Stores often swallow errors silently. | `goalsStore.ts`, `analyticsStore.ts`, `tasksStore.ts` | Preserve user-facing errors and structured telemetry for important failures. |
| Medium | Build artifacts | `dist`, generated logs, `typecheck_output.txt`, and old build error files are present locally. | `apps/mobile/dist`, `backend/api_legacy/dist`, `functions/build_error*.txt` | Keep ignored. Do not use generated artifacts as source of truth. |
| Low | Encoding damage | Several files show mojibake comments/text such as corrupted separator lines and currency symbols. | `firestore.rules`, `functions/src/shared.ts`, `intelligence.ts` | Clean gradually when touching those files. |
| Low | Navigation consistency | Some routes use path casts and one route references `router.replace('/khata')`, which may be wrong under Expo Router grouping. | `budget-insights.tsx` | Centralize route constants. |

## Security Issues Found

| Risk | Issue | Details | Phase |
|---|---|---|---|
| Critical | Public AI endpoint | `/api/chat` is unauthenticated and accepts arbitrary `systemContext`. | Phase 1 |
| Critical | Legacy backend still has production-looking API URL | Mobile points production legacy API to `https://api.atlasai.app`. If deployed, it can become a second backend authority. | Phase 1 |
| High | Client-provided AI context | Client can pass `systemContext`; server-side AI should derive trusted context only from server-owned data. | Phase 1 |
| High | Secrets exist in local `.env` files | `.env` files are ignored, but API keys and JWT secrets are present locally. Values were not printed in this audit. | Ongoing |
| High | Google services files present in workspace | `google-services.json` exists at root and mobile app. It is ignored, but local presence requires care. | Ongoing |
| Medium | Firestore broad client writes | Some collections allow generic create/update with only `docSizeOk`, especially analytics, budgets, health, digital usage, profile. | Phase 2 |
| Medium | AI parse error logging | `safeParseJSON` stores raw model output snippets up to 2000 chars. Could include user data. | Phase 2 |
| Medium | Legacy logging | Legacy API logs request message snippets and full errors in development. | Phase 2 |
| Medium | No App Check observed | Firebase App Check is not configured in app code. | Phase 2 |
| Low | Firestore rules comments are corrupted | Not a runtime issue, but it reduces maintainability of critical security policy. | Phase 2 |

No client-side direct Gemini/OpenAI SDK call was found in the mobile app. Mobile AI calls route through server paths, but the server path ordering and public legacy fallback are not acceptable for production.

## UI/UX Issues Found

Strong screens:

- Welcome/auth/register/login: relatively focused, uses validation and current product tone.
- Dashboard: good command-center direction and module access surface.
- Tasks: core execution module is substantial and connected to Firestore.
- Mentor: substantial UI and real server-side AI integration path exists.
- Reflection: deep workflow, but too large and should be decomposed.

Needs full or near-full redesign:

- Analytics: high line count and likely too screen-local; needs executive-report framing.
- Reflection: over 1000 lines; should become smaller components and feed Cortex directly.
- Profile: large screen with mixed responsibilities.
- Khata/finance group: useful features but should become finance discipline intelligence, not isolated bookkeeping pages.
- Security group: conceptually strong, but data model/rules mismatch makes it unreliable.
- News: should be delayed unless it contributes to discipline/career/security intelligence.

Inconsistent UI patterns:

- Many screens implement local headers/back buttons/styles instead of shared screen primitives.
- Tab icons and action cards use text badges instead of a coherent icon system.
- Several modules feel like isolated apps rather than one operating system.
- Some screens are very large, which increases regression risk and slows visual consistency work.

## Dead, Duplicate, Placeholder, and Mock-Only Code

| Risk | Code | Finding | Recommendation |
|---|---|---|---|
| High | `backend/api_legacy` | Duplicates Firebase auth/tasks/mentor/reflection/analytics with MongoDB/JWT. | Archive or explicitly mark dev-only after Firebase parity is confirmed. |
| High | `apps/mobile/src/services/api_legacy` | Legacy API client remains wired into AI flow. | Remove from production AI path in Phase 1. |
| High | `backend/api_legacy/src/app.ts` | Public `/api/chat` bypasses versioned auth modules. | Remove or dev-gate. |
| Medium | `backend/api_legacy/src/config/database.ts` | DB-less/mock mode fallback exists. | Good for demos, unsafe as production behavior. |
| Medium | `apps/mobile/src/services/security/analysis.ts` | TODO for future Python ML API. | Keep delayed; do not build more backend types until Firebase model stabilizes. |
| Medium | `apps/mobile/app/(main)/analytics.tsx` | `Year` time range explicitly not implemented. | Hide unimplemented UI or implement later. |
| Low | `functions/build_error*.txt`, `apps/mobile/all_errors.txt` | Old generated diagnostic files. | Ignore/remove in cleanup phase if not needed. |
| Low | `apps/mobile/dist`, `backend/api_legacy/dist`, `functions/lib` | Generated outputs present locally. | Do not audit as source; keep ignored. |

## Module Disposition

Keep and harden immediately:

- Firebase Auth/onboarding.
- Dashboard command center.
- Tasks.
- Goals.
- AI Mentor through Firebase Functions.
- Reflection.
- Cortex state and Cloud Functions.
- Firestore rules and indexes.

Upgrade after Phase 1:

- Analytics as an executive discipline report.
- Khata/finance as budget discipline intelligence.
- Health as execution-capacity tracking.
- Digital usage as distraction/signal tracking.
- Security/Shield as verified risk and hygiene tracking.
- Notifications as intervention delivery.

Delay:

- News, unless it becomes career/security/discipline briefing input.
- Python ML security API.
- Enterprise/team concepts.
- Subscription/paywall.

Archive or isolate:

- Legacy Express backend from production mobile flows.
- MongoDB/JWT auth path if Firebase remains the production backend.
- Public unauthenticated AI endpoint.

## Build and Validation Commands

Commands requested and run:

| Command | Result |
|---|---|
| `npm run typecheck --workspaces --if-present` | Passed. Ran mobile and legacy API typecheck. Functions has no `typecheck` script, so npm skipped it. |
| `npm run build --workspace=functions` | Passed. |
| `npm run build --workspace=backend/api_legacy` | Passed. |
| `npm run typecheck --workspace=apps/mobile` | Passed. |

No typecheck/build blocker required source fixes in this phase.

## Commands Run During Audit

- `Get-ChildItem -Force`
- `rg --files`
- `git status --short`
- `Get-Content package.json`
- `rg --files -g '!node_modules' -g '!**/node_modules/**' -g '!functions/lib/**' -g '!test-recordings/**'`
- `Get-ChildItem -Recurse -Force -Depth 3 apps,functions,backend,docs`
- `Get-Content apps\mobile\package.json`
- `Get-Content functions\package.json`
- `Get-Content backend\api_legacy\package.json`
- `Get-Content firebase.json`
- `Get-Content firestore.rules`
- `rg` searches for Firestore calls, AI calls, secrets-related names, exports/routes, TODO/mock markers
- Targeted reads of Firebase config, Firestore helpers, Cloud Functions, legacy API app/config/middleware, stores, data services, and layouts
- Requested validation commands listed above

Note: `git status --short` failed because this workspace is not currently inside a Git repository.

## Recommended Phase-by-Phase Fix Plan

### Phase 1: Firebase-First Safety Lock

Goal: remove production ambiguity and secure AI paths.

1. Change mobile AI mentor flow to use Firebase callable Functions first and only.
2. Remove or dev-gate legacy public `/api/chat`.
3. Remove client-provided `systemContext` from production AI calls.
4. Align security service write paths with Firestore rules.
5. Add route constants and fix any incorrect grouped route paths.
6. Add a short `docs/ATLAS_PHASE_1_REPORT.md`.

### Phase 2: Firestore Contract Hardening

1. Tighten rules for profile, analytics, budgets, health, and digital usage.
2. Add schema validators for missing collections.
3. Add App Check plan and emulator test coverage for rules.
4. Add indexes for actual query patterns.
5. Decide retention policy for conversations, AI feedback, and parse errors.

### Phase 3: Cortex Expansion

1. Extend Cortex to include finance, health, digital, security, and notification signals.
2. Move key analytics calculations server-side.
3. Add intervention event model.
4. Add daily briefing and weekly report generation.

### Phase 4: UI System and Screen Decomposition

1. Create shared screen shell/header/action primitives.
2. Split large screens: tasks, reflection, mentor, analytics, profile.
3. Standardize icons, empty states, loading states, and error states.
4. Verify key flows with web/native screenshots.

### Phase 5: Product Intelligence

1. Build the execution-failure predictor.
2. Add intervention delivery rules.
3. Add weekly executive report.
4. Add privacy dashboard and export/delete workflow.

## Exact Next Steps for Phase 1

1. Edit `apps/mobile/src/services/ai/mentor.ts` so production AI calls go through Firebase callable `chatWithMentor` and do not call legacy `/api/chat`.
2. Remove or guard `POST /api/chat` in `backend/api_legacy/src/app.ts` behind development-only configuration and never accept unauthenticated `systemContext`.
3. Update `functions/src/chat.ts` to ignore client-provided `systemContext` unless an explicit emulator/dev flag is enabled.
4. Fix security write paths:
   - Either route all client security writes through existing `securityEvents`, `securityScans`, and `linkAnalysis`.
   - Or add strict rules for `wifiSecurityEvents`, `deviceRiskReports`, and `cyberDisciplineLogs`.
5. Add emulator/rules tests for the security collections and AI server-written collections.
6. Create `docs/ATLAS_PHASE_1_REPORT.md` after implementation with files changed, commands run, and remaining risk.

## Phase 0 Change Log

Files modified:

- `docs/ATLAS_PHASE_0_AUDIT.md`

No app/backend source code was refactored in Phase 0.
