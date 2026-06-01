# AltasAI Firebase Test Report

**Date**: 2026-06-01

---

## Firebase Auth

| Check | Status | Notes |
|---|---|---|
| Auth middleware in backend | PASS | `requireAuth` verifies Firebase ID tokens via Admin SDK |
| Auth token rejection test | PASS | `api-routes.test.ts`: 401 on missing token |
| Auth token expiry handling | PASS | Firebase Admin SDK validates expiry automatically |
| Email/password sign-in | NOT TESTED (requires device/emulator) | Manual test required |
| Re-login after logout | NOT TESTED | Manual test required |
| Profile subscription cleanup | PASS (unit) | `authStore.ts` cleanup verified in mobile-workflow-smoke.test.ts |

---

## Firestore Rules

| Test | Status | Blocker |
|---|---|---|
| User reads own profile | BLOCKED | Java 21 required (Java 17 installed) |
| User cannot read other profile | BLOCKED | Same |
| Task/goal/reflection ownership | BLOCKED | Same |
| Server-owned collection write prevention | BLOCKED | Same |
| `serverQuotas` deny-all | BLOCKED | Same |
| `rateLimits` deny-all | BLOCKED | Same |
| Intervention status-only update | BLOCKED | Same |

**All rules tests PASS in GitHub Actions CI** (Java 21 installed there).  
See `FIRESTORE_RULES_TEST_BLOCKER.md` for unblock steps.

---

## Firestore Security Rules Review (Static)

Reviewed `firestore.rules` — all rules verified by reading:

| Collection | Client Can Read | Client Can Write | Write Validator |
|---|---|---|---|
| `users/{uid}/profile` | Own only | Own only | `docSizeOk()` |
| `users/{uid}/tasks` | Own only | Own only | `validateTask()` — 5 fields validated |
| `users/{uid}/goals` | Own only | Own only | `validateGoal()` — progress 0-100 enforced |
| `users/{uid}/dailyLogs` | Own only | Own only (create+update) | `validateLog()` — mood/energy 1-5 |
| `users/{uid}/focusSessions` | Own only | Own only (read+create+update) | `docSizeOk()` |
| `users/{uid}/conversations` | Own only | **DENIED** | Backend-written |
| `users/{uid}/cortex` | Own only | **DENIED** | Backend-written |
| `users/{uid}/reports` | Own only | **DENIED** | Backend-written |
| `users/{uid}/aiFeedback` | Own only | **DENIED** | Backend-written |
| `users/{uid}/interventions` | Own only | Own (create), status-only update | `validateIntervention()` |
| `serverQuotas` | **DENIED** | **DENIED** | Deny-all |
| `rateLimits` | **DENIED** | **DENIED** | Deny-all |
| `ai_parse_errors` | **DENIED** | **DENIED** | Deny-all |
| All other paths | **DENIED** | **DENIED** | Catch-all deny |

---

## Memory Service Resilience (New Test)

```
PASS src/__tests__/memory-resilience.test.ts
  ✓ returns empty arrays when ALL critical Firestore queries fail
  ✓ returns partial data when only secondary queries fail
  ✓ logs a warning for each failed query
```

This test was added because the original `memory.ts` had no `.catch()` on 5 critical queries:
- `profile/data` — no catch (FIXED)
- `tasks` query — no catch, uses composite index that could be missing (FIXED)
- `goals` query — no catch (FIXED)
- `dailyLogs` query — no catch (FIXED)
- `cortex/riskState` — no catch (FIXED)

**Impact of fix**: If any Firestore query fails (missing index, permission error, network timeout), the AI pipeline now returns empty data gracefully instead of crashing with 500.

---

## Firestore Indexes

The `firestore.indexes.json` defines 5 composite indexes:
- `securityEvents`: resolved + createdAt
- `securityEvents`: severity + resolved + createdAt
- `tasks`: userId + scheduledDate
- `tasks`: userId + status + scheduledDate
- `dailyLogs`: userId + date

The `tasks` composite index (userId + scheduledDate) is **required** for the `retrieveSafeMemory` task query. Without it, the `memory.ts` query would throw `FAILED_PRECONDITION`. This was a silent crash risk before the P0 fix.

**Action required**: Deploy indexes before beta: `npx firebase deploy --only firestore:indexes --project altasai`

---

## Manual Firebase Tests Needed (Real Device / Emulator)

| Test | Plan |
|---|---|
| Register → profile created in Firestore | After Java 21 install: emulator seed + rules test |
| Task create → appears in Firestore with correct schema | Manual check via Firebase Console |
| Reflection → daily log created with all required fields | Manual check |
| Mentor call → conversation written by backend | Verify via Firebase Console after mentor API call |
| Cross-user read isolation | Firestore rules test (needs emulator) |
