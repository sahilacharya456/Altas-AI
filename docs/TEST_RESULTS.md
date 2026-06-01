# AltasAI Test Results

**Date**: 2026-06-01 (updated after Java 21 install)
**Node**: v22.22.3
**Java**: OpenJDK 21.0.11 (Adoptium Temurin)
**Python**: 3.12.10

---

## Summary

| Suite | Tests | Result |
|---|---|---|
| Mobile Jest | 21 | ✅ PASS |
| Backend Jest | 31 | ✅ PASS |
| Firestore Rules (emulator) | 5 | ✅ PASS |
| Backend TypeScript models (evaluate:altasai) | 7 | ✅ PASS |
| Python ML service (ml:evaluate) | 7 | ✅ PASS |
| Python ML unit tests (ml:test) | 9 | ✅ PASS |
| **TOTAL** | **80** | **✅ ALL PASS** |

---

## Mobile Tests (apps/mobile)

```
PASS  src/__tests__/featureFlags.test.ts
PASS  src/__tests__/homeNavigation.test.ts
PASS  src/__tests__/backendClient.test.ts
PASS  src/__tests__/mobile-workflow-smoke.test.ts
PASS  src/services/analytics/productEvents.test.ts
PASS  src/navigation/resolveInitialRoute.test.ts

Test Suites: 6 passed, 6 total
Tests:       21 passed, 21 total
```

### What is tested
- Feature flags: MVP flags on, postponed flags off, isEnabled helper
- Home navigation: quickModules contain only MVP routes, Finance/Health/News excluded
- Backend client: env var name regression (`EXPO_PUBLIC_ALTASAI_API_BASE_URL`)
- Workflow smoke: auth routing, task CRUD, focus, reflection, mentor fallback, reports, profile
- Product events: event tracking structure and buffer
- Route resolution: auth redirect, onboarding redirect

---

## Backend Tests (backend/api)

```
PASS  src/__tests__/api-routes.test.ts
PASS  src/__tests__/altasai-intelligence.test.ts
PASS  src/__tests__/memory-resilience.test.ts
PASS  src/__tests__/ml-service-client.test.ts
PASS  src/__tests__/production-guard.test.ts
PASS  src/__tests__/security-middleware.test.ts

Test Suites: 6 passed, 6 total
Tests:       31 passed, 31 total
```

### What is tested
- API routes: auth rejection, mentor fallback, quota enforcement, Cortex, recommendation feedback, security advice, health, admin stats
- AltasAI intelligence: intent (3 cases), entity extraction, reflection analysis, productivity patterns, mentor plan, report insight, user state vector, 5 risk models, finance/health/anomaly/safety/cortex models, full orchestrator
- Memory resilience: all queries fail → empty arrays; partial failure → partial data; warnings logged
- ML service client: health check, fallback when unavailable, full orchestrator with ML
- Production guard: throws on missing service account in production; passes in dev/test
- Security middleware: admin token required; App Check enforcement; token validation

---

## Firestore Rules Tests (emulator + Java 21)

```
PASS  src/__tests__/firestore.rules.test.ts

  Firestore security rules
    ✓ users can read and write only their own profile document (848ms)
    ✓ unauthenticated users are denied (83ms)
    ✓ tasks, goals, and reflections enforce ownership and schema (146ms)
    ✓ client cannot write server-owned AI collections (138ms)
    ✓ interventions are client-readable, status-updatable only (107ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

Run with: `npm run test:rules --workspace=@altasai/backend`
(Requires Java 21 — installed at `/c/Program Files/Eclipse Adoptium/jdk-21.0.11.10-hotspot`)

---

## TypeScript Model Evaluation (evaluate:altasai)

```
PASS intent_classification:   score=1.000  threshold=0.80
PASS entity_extraction:       score=0.875  threshold=0.75
PASS reflection_analysis:     score=1.000  threshold=0.75
PASS recommendation_ranking:  score=1.000  threshold=0.80
PASS risk_models:             score=1.000  threshold=0.75
PASS report_completeness:     score=1.000  threshold=0.85
PASS safety_guardrail:        score=1.000  threshold=0.90
```

---

## Python ML Evaluation (ml:evaluate)

```
PASS intent_classifier:       score=1.000  threshold=0.85
PASS entity_extractor:        score=0.983  threshold=0.80
PASS risk_models:             score=1.000  threshold=0.75
PASS recommendation_engine:   score=1.000  threshold=0.80
PASS rag_retrieval:           score=1.000  threshold=0.75
PASS safety_guardrail:        score=0.944  threshold=0.90
PASS vision_adapter:          score=1.000  threshold=0.80
```

## Python Unit Tests (ml:test)

```
9 passed in 1.33s
```

---

## Other Checks

| Check | Result |
|---|---|
| `npm run typecheck --workspaces` | ✅ 0 errors |
| `npm run build --workspace=@altasai/backend` | ✅ clean |
| `npx eslint src --max-warnings 0` (mobile) | ✅ 0 warnings |
| `npm audit --audit-level=high` | ✅ 0 high, 0 critical |
| `npm run ml:train` | ✅ accuracy=1.0 |
| Emulator seed script | ✅ seeded demo_user successfully |
