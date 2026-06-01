# AltasAI Test Data Plan

## Safety Rules (Non-Negotiable)

1. All test data goes to Firebase Emulator or a dedicated test Firebase project.
2. The seed script (`scripts/seed-demo-data.js`) refuses to run without `FIRESTORE_EMULATOR_HOST` set.
3. Test user IDs use a `qa_` prefix: `qa_new_user`, `qa_active_user`, etc.
4. No real passwords in any committed file. Use `QA_TEST_PASSWORD` env var.
5. Seed script is idempotent — re-running does not duplicate data.

---

## Test User Profiles

| ID | Name | State | Purpose |
|---|---|---|---|
| `qa_new_001` | "New User" | Registered, onboarding NOT complete | Tests onboarding redirect |
| `qa_onboarded_001` | "Empty Alex" | Onboarded, zero tasks/data | Tests empty states |
| `qa_active_001` | "Active Sahil" | 3 tasks, 1 focus, 2 reflections, mentor history | Core loop E2E |
| `qa_overdue_001` | "Behind Blake" | 2 overdue tasks, 3 carried, no recent reflection | Tests burnout/risk signals |
| `qa_mentor_001` | "Chat Casey" | Has mentor conversation history | Tests mentor context continuity |
| `qa_sparse_001` | "Sparse Dana" | 1 task, partial data | Tests fallback/graceful degradation |

---

## Test Data Sets

### Minimal (for unit/integration tests)
Used in `altasai-intelligence.test.ts` and `api-routes.test.ts`. Defined inline as fixtures.

### Emulator Seed (for local E2E)
Run with: `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/seed-demo-data.js`

Current seed creates for `demo_user`:
- Profile (onboarded, strict mode, real scores)
- 1 pending task (today, high priority)
- 1 daily log (mood 4, energy 3, wins/struggles)

**Needs expanding** — see `TEST_SEED_GUIDE.md` for the full expansion plan.

### Production-safe smoke data (if no emulator)
Use the backend health check and internal test calls only. Never write to production Firestore during QA.

---

## Failure Mode Test Data

| Scenario | How to Test |
|---|---|
| Empty user (no tasks) | `qa_onboarded_001` — fresh account |
| Missing composite index | Only testable in real Firebase project — watch for FAILED_PRECONDITION in logs |
| Gemini unavailable | Unset `GEMINI_API_KEY` in backend `.env` |
| ML service unavailable | Don't start `backend/ml-service` |
| Firestore read timeout | Testable in integration test via mock (see `memory-resilience.test.ts`) |
| Auth token expired | Firebase tokens expire after 1 hour — wait or manually revoke in console |
| Network offline | Airplane mode on device |

---

## Environment Variables for Test

```bash
# For emulator seed script:
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
GCLOUD_PROJECT=altasai-test
ATLAS_DEMO_UID=qa_active_001

# For backend test runs (already mocked in Jest):
NODE_ENV=test
FIREBASE_PROJECT_ID=altasai-test
```
