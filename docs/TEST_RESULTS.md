# AltasAI Test Results

**Date**: 2026-06-01  
**Node**: 20.x  
**Run command**: `npm test --workspaces --if-present`

---

## Mobile Tests (apps/mobile)

```
PASS  src/__tests__/featureFlags.test.ts
PASS  src/__tests__/backendClient.test.ts
PASS  src/services/analytics/productEvents.test.ts
PASS  src/__tests__/mobile-workflow-smoke.test.ts
PASS  src/navigation/resolveInitialRoute.test.ts

Test Suites: 5 passed, 5 total
Tests:       18 passed, 18 total
```

### What is tested
- Feature flags: MVP flags enabled, postponed flags disabled
- Backend client: correct env variable name, BackendApiError shape
- Product events: event tracking structure and buffer
- Mobile workflow smoke: auth routing, task CRUD, focus mode, reflection, mentor fallback, report states, profile
- Navigation routing: auth redirect, onboarding redirect

---

## Backend Tests (backend/api)

```
PASS  src/__tests__/api-routes.test.ts
PASS  src/__tests__/altasai-intelligence.test.ts
PASS  src/__tests__/ml-service-client.test.ts
PASS  src/__tests__/security-middleware.test.ts
SKIP  src/__tests__/firestore.rules.test.ts (requires Java 21 + Firebase emulator)

Test Suites: 1 skipped, 4 passed, 4 of 5 total
Tests:       5 skipped (rules), 25 passed, 30 total
```

### What is tested
- API routes: auth rejection, mentor fallback, quota enforcement, Cortex, recommendation feedback, security advice, health, admin stats
- AltasAI intelligence: intent, entity, reflection, patterns, mentor plan, reports, user state vector, 10+ models, orchestrator
- ML service client: health check, fallback when unavailable, full orchestrator with ML
- Security middleware: rate limit, App Check enforcement

### Firestore rules test (skipped locally)
Requires `Java 21 + firebase-tools`. Passes in GitHub Actions CI (`setup-java@v4`).

---

## Typecheck

```
npm run typecheck --workspaces --if-present
EXIT: 0 (PASS)
```

---

## Lint (mobile)

```
npx eslint src --ext .ts,.tsx --max-warnings 0
EXIT: 0 (PASS — 0 warnings, 0 errors)
```

---

## Build

```
npm run build --workspace=@altasai/backend
EXIT: 0 (PASS)
```

---

## Security Audit

```
npm audit --audit-level=high
0 high severity vulnerabilities
17 moderate (ws package, transitive Expo dependency, no direct exploitability)
```

---

## Not Run (requires CI environment)

- `npm run ml:train && npm run ml:evaluate && npm run ml:test` — Python 3.12 + scikit-learn
- `npm run test:rules --workspace=@altasai/backend` — Java 21 + Firebase emulator
- `npm run evaluate:altasai --workspace=@altasai/backend` — Can be run locally with `tsx`
