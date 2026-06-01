# AltasAI Security Test Report

**Date**: 2026-06-01  
**Method**: Static analysis, automated tests, manual code review

---

## Secret Scan Results

| Check | Result | Evidence |
|---|---|---|
| `.env` files in git | PASS | `git check-ignore -v apps/mobile/.env backend/api/.env` returns gitignore rules |
| `.env` files tracked | PASS | `git ls-files \| grep "\.env$"` returns empty |
| Real API keys in tracked files | PASS | Pattern scan `AIzaSy\|private_key\|-----BEGIN` found only field names/docs |
| `.claude/` IDE directory | PASS | Added to `.gitignore`, removed from staging |
| `GEMINI_API_KEY` in docs | PASS | Only appears as `GEMINI_API_KEY=...` placeholder |
| Firebase service account | PASS | Backend `.env` has it commented out |

---

## Backend Security Tests

All backend tests pass:
```
PASS src/__tests__/security-middleware.test.ts
Tests:
  ✓ requires admin token when monitoring token is configured
  ✓ allows admin access with configured token
  ✓ requires Firebase App Check token when enforcement is enabled
  ✓ verifies Firebase App Check token when enforcement is enabled
```

---

## Production Guard Tests

```
PASS src/__tests__/production-guard.test.ts
Tests:
  ✓ throws if FIREBASE_SERVICE_ACCOUNT_JSON is missing in production
  ✓ does not throw in development without service account
  ✓ does not throw in test environment
```

---

## CORS Configuration

```typescript
cors({
  origin: (origin, callback) => {
    if (!origin || env.allowedOrigins.includes(origin)) { callback(null, true); return; }
    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: false,
})
```

- Whitelist-based (not open `*`)
- `credentials: false` — cookies not allowed
- Configurable via `ALLOWED_ORIGINS` env var
- Production warning fires if localhost origins are set

---

## Rate Limiting

```typescript
rateLimit({ windowMs: 60_000, max: 40, standardHeaders: true, legacyHeaders: false })
```
Applied to all `/api/*` routes: 40 requests/minute per IP.

---

## Auth Middleware

Every `/api/*` route requires valid Firebase ID token via `requireAuth` middleware:
- Extracts Bearer token from Authorization header
- Verifies with `auth.verifyIdToken(token)` — Firebase Admin SDK
- Returns `ApiError(401, "Missing Firebase ID token", "unauthenticated")` if missing
- Returns `ApiError(401, "Invalid or expired token", "unauthenticated")` if invalid

---

## Quota System

- Per-user, per-bucket, per-day limit enforced via Firestore transaction
- Falls back to in-memory counter if Firestore unavailable (acceptable — degrades, doesn't fail open)
- `serverQuotas` collection: client write denied by Firestore rules

---

## Helmet Configuration

`helmet()` applied — sets all standard HTTP security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (on HTTPS)
- `Content-Security-Policy` (Helmet default)

---

## Stack Trace Exposure

Error handler in `lib/http.ts` returns:
```json
{ "error": { "code": "internal_error", "message": "Request failed.", "requestId": "req-xxx" } }
```
No stack traces, no internal error details, no file paths in production error responses.

---

## npm Audit

```
0 high severity vulnerabilities
0 critical severity vulnerabilities
17 moderate (transitive via Expo/ws package — not exploitable in this context)
```

---

## Remaining Security Risks

| Risk | Status | Mitigation |
|---|---|---|
| App Check disabled | OPEN | Set `REQUIRE_APP_CHECK=true` in production after configuring Firebase App Check |
| No crash reporting | OPEN | Sentry setup documented in `CRASH_REPORTING_SETUP.md` |
| Admin endpoints unauthenticated in dev | MITIGATED | Warning log fires; token required in production |
| Firebase web API key in `.env` | ACCEPTABLE | Not a secret — gitignored, public Firebase client config |
| No email enumeration protection | OPEN (P2) | Enable in Firebase Console → Authentication → Settings |
