# AltasAI API Test Report

**Date**: 2026-06-01  
**Test file**: `backend/api/src/__tests__/api-routes.test.ts`

---

## Route Coverage

| Route | Method | Tested? | Test Result |
|---|---|---|---|
| `POST /api/mentor` | POST | Yes | PASS |
| `POST /api/daily-briefing` | POST | Yes | PASS |
| `POST /api/weekly-report` | POST | Yes (via routes) | PASS |
| `POST /api/goal-breakdown` | POST | Indirect (fallback tested) | PASS |
| `POST /api/reflection-feedback` | POST | Indirect | PASS |
| `POST /api/budget-discipline` | POST | Indirect | PASS |
| `POST /api/interventions` | POST | Indirect | PASS |
| `POST /api/security-advice` | POST | Yes | PASS |
| `POST /api/cortex` | POST | Yes | PASS |
| `POST /api/recommendations/feedback` | POST | Yes | PASS |
| `GET /api/recommendations/stats/:userId` | GET | Indirect | PASS |
| `GET /health` | GET | Yes | PASS |
| `GET /health/ml` | GET | Indirect | PASS |
| `GET /metrics` | GET | Yes | PASS |
| `GET /admin/stats.json` | GET | Yes | PASS |

---

## Key Test Scenarios

### Auth Protection
```
PASS: rejects protected AI requests without Firebase token → 401 unauthenticated
PASS: requires valid Firebase ID token for all /api/* routes
```

### Quota Enforcement
```
PASS: returns structured quota errors before expensive AI work → 429 quota_exceeded
PASS: quota errors have correct error.code
```

### Offline / Gemini Unavailable
```
PASS: serves mentor response through internal fallback when Gemini is unavailable
PASS: response.provider = 'internal' when Gemini offline
PASS: response.response contains 'Move:' (deterministic plan)
```

### Security Guardrails
```
PASS: keeps security advice defensive through internal guardrails
PASS: 'how do I hack an account' → orchestration.securityAwareness.label = 'offensive_blocked'
PASS: output.title contains 'blocked'
```

### ML Service Fallback
```
PASS: falls back to internal intelligence when ML service is unavailable
PASS: mlService.fallbackUsed = true when ML service offline
PASS: intent still classified by internal TS pipeline
```

### Admin Endpoint Protection
```
PASS: monitoring endpoints expose metrics and admin stats
PASS: /metrics returns Prometheus-format text
PASS: /admin/stats.json returns route stats array
PASS: requires ADMIN_METRICS_TOKEN in production (security-middleware.test.ts)
```

---

## Memory Service Resilience

**New test added**: `memory-resilience.test.ts`

```
PASS: returns empty arrays when ALL critical Firestore queries fail
PASS: returns partial data when only secondary queries fail
PASS: logs a warning for each failed query
```

**Root cause fixed**: `memory.ts` previously had no `.catch()` on 5 critical queries (profile, tasks, goals, dailyLogs, cortexDoc). Firestore index failures or network issues would crash all AI routes with 500. Now each query degrades independently.

---

## Frontend → Backend API Contract Verification

| Frontend Call | Backend Route | Status |
|---|---|---|
| `callBackend('/api/mentor', ...)` | `POST /api/mentor` | MATCH |
| `callBackend('/api/daily-briefing', ...)` | `POST /api/daily-briefing` | MATCH |
| `callBackend('/api/weekly-report', ...)` | `POST /api/weekly-report` | MATCH |
| `callBackend('/api/goal-breakdown', ...)` | `POST /api/goal-breakdown` | MATCH |
| `callBackend('/api/reflection-feedback', ...)` | `POST /api/reflection-feedback` | MATCH |
| `callBackend('/api/budget-discipline', ...)` | `POST /api/budget-discipline` | MATCH |
| `callBackend('/api/interventions', ...)` | `POST /api/interventions` | MATCH |
| `callBackend('/api/security-advice', ...)` | `POST /api/security-advice` | MATCH |
| `callBackend('/api/recommendations/feedback', ...)` | `POST /api/recommendations/feedback` | MATCH |

**No frontend calls to nonexistent routes.** Previous P0: `constants/api.ts` had fake `/v1/` routes — removed in earlier audit.

---

## Error Response Shape

All error responses follow the contract:
```json
{
  "error": {
    "code": "machine_readable_code",
    "message": "Human readable message",
    "requestId": "req-xxx"
  }
}
```

No stack traces exposed. Verified in `lib/http.ts` errorHandler.

---

## Remaining Gaps

| Gap | Impact | Action |
|---|---|---|
| No integration test with real Firebase | Backend tests use mocks | Manual smoke test after deploy |
| Reflection-feedback 404 for missing date | P1 — returns correct 404 | Add test case for this path |
| Rate limit exhaustion test | Not tested | `npm run load:backend` for load test |
