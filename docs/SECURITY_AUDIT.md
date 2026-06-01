# AltasAI Security Audit

**Date**: 2026-06-01  
**Status**: Demo-safe. Not production-hardened.

---

## Secrets & Env Safety

| Item | Status | Notes |
|---|---|---|
| `.env` files gitignored | PASS | Root + mobile `.gitignore` both ignore `.env` |
| `apps/mobile/.env` committed | NOT a git repo yet | When initializing git, confirm `.env` is not tracked: `git check-ignore -v apps/mobile/.env` |
| Firebase client config in `.env` | ACCEPTABLE | EXPO_PUBLIC_* vars are client-side Firebase config, not secrets. Fine to be in `.env` |
| Gemini API key | PASS | Backend only, never in EXPO_PUBLIC_* |
| Firebase service account JSON | PASS | Backend only, never in mobile |
| `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env` example | ACCEPTABLE | Contains placeholder, not real credentials |

**When initializing git:**
```bash
git init
git add .
# Verify .env files are NOT staged:
git status | grep env
# Should show nothing. If .env appears, run:
echo "apps/mobile/.env" >> .gitignore
echo "backend/api/.env" >> .gitignore
```

---

## Firebase Security Rules

| Collection | Status | Notes |
|---|---|---|
| `users/{uid}/tasks` | PASS | Validated, owner-only |
| `users/{uid}/conversations` | PASS | Client read-only, backend writes via Admin SDK |
| `users/{uid}/cortex` | PASS | Client read-only, backend writes |
| `users/{uid}/reports` | PASS | Client read-only, backend writes |
| `users/{uid}/aiFeedback` | PASS | Client read-only, backend writes |
| `serverQuotas` | PASS (fixed) | Previously had no rule — deny-all added |
| `rateLimits` | PASS | Deny-all |
| `ai_parse_errors` | PASS | Deny-all |
| Catch-all `/{document=**}` | PASS | Deny-all |

**Action required before production:**
```bash
npx firebase deploy --only firestore:rules,firestore:indexes --project altasai
```

---

## Backend API Security

| Check | Status | Notes |
|---|---|---|
| Firebase ID token verification | PASS | All `/api/*` routes require Bearer token |
| CORS | PASS | Whitelist-based, configured via `ALLOWED_ORIGINS` env var |
| Helmet | PASS | Applied to all routes |
| Rate limiting | PASS | 40 req/min per IP on `/api/*` |
| Quota per user | PASS | Firestore transaction + in-memory fallback |
| Input validation | PASS | Zod schemas on all request bodies |
| App Check | NOT ENFORCED | `REQUIRE_APP_CHECK=false` by default. Must be `true` in production. |
| Admin endpoints | PASS (improved) | Logs warning in dev, requires token in production |
| Logging of sensitive data | PASS | `compactDoc()` strips `userId`, `email`, `rawPrompt`, `rawResponse` |
| SQL injection | N/A | Uses Firestore, no raw SQL |
| XSS | LOW RISK | No HTML rendering on backend |

---

## Production Security Checklist

Before any public/beta deployment:

- [ ] Initialize git and verify `.env` files are not tracked
- [ ] Set `REQUIRE_APP_CHECK=true` in production environment
- [ ] Set `ADMIN_METRICS_TOKEN` (min 16 chars) in production environment
- [ ] Deploy Firestore security rules: `npx firebase deploy --only firestore:rules`
- [ ] Enable Firebase App Check in Firebase Console (Play Integrity for Android, DeviceCheck for iOS)
- [ ] Rotate Firebase service account key if the placeholder `.env.example` key was ever used
- [ ] Set up monitoring alerts for 5xx rates and quota abuse
- [ ] Review `ALLOWED_ORIGINS` to remove localhost entries in production

---

## Risk Matrix

| Risk | Severity | Current Mitigation | Required Fix |
|---|---|---|---|
| Real Firebase API key on disk in `.env` | Medium | gitignored | Initialize git correctly |
| App Check disabled | High | Rate limiting + auth token | Enable in production |
| Admin endpoints open in dev | Low | Warning log added | Set token before staging |
| ML service stubs accessible | Low | Graceful fallback | Gate stub routes |
| No crash reporting | Medium | None | Sentry or Crashlytics before beta |
