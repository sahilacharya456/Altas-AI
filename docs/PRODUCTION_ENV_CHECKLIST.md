# AltasAI Production Environment Checklist

Use this before every production deployment.

---

## Mobile App (`apps/mobile/.env`)

| Variable | Required | Value | Notes |
|---|---|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase web API key | Public — safe for client |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | `your-project.firebaseapp.com` | |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Yes | `altasai` | |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | `altasai.appspot.com` | |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Number | |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Yes | `1:xxx:android:xxx` | |
| `EXPO_PUBLIC_ALTASAI_API_BASE_URL` | Yes | `https://api.altasai.app` | Change from localhost for production build |
| `EXPO_PUBLIC_SENTRY_DSN` | No (P1) | `https://xxx@yyy.ingest.sentry.io/zzz` | Required for crash reporting. See `CRASH_REPORTING_SETUP.md` |

**Warning:** Never use `EXPO_PUBLIC_ATLAS_API_BASE_URL` — that was a P0 bug that is now fixed. The correct name is `EXPO_PUBLIC_ALTASAI_API_BASE_URL`.

---

## Backend API (`backend/api/.env`)

| Variable | Required | Production Value | Dev Default |
|---|---|---|---|
| `PORT` | Yes | `3001` (or hosting-assigned) | `3001` |
| `NODE_ENV` | Yes | `production` | `development` |
| `ALLOWED_ORIGINS` | Yes | `https://your-app.com` | `http://localhost:8081` |
| `FIREBASE_PROJECT_ID` | Yes | `altasai` | `altasai` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | **Yes** | Full JSON from Firebase Console | — |
| `GEMINI_API_KEY` | No | Gemini API key | — (runs with fallback) |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | `gemini-2.5-flash` |
| `AI_DAILY_QUOTA` | No | `60` | `60` |
| `ML_SERVICE_BASE_URL` | No | `http://localhost:8001` | `http://127.0.0.1:8001` |
| `ML_SERVICE_TIMEOUT_MS` | No | `3500` | `3500` |
| `REQUIRE_APP_CHECK` | **Yes in production** | `true` | `false` |
| `ADMIN_METRICS_TOKEN` | **Yes in production** | 32+ random chars | — |

### Generating a secure ADMIN_METRICS_TOKEN:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Getting FIREBASE_SERVICE_ACCOUNT_JSON:
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Minify: `cat service-account.json | python3 -m json.tool --compact`
5. Set as single-line env var in Render/Railway

---

## Production Pre-Deployment Verification

```bash
# 1. Build succeeds
npm run build --workspace=@altasai/backend

# 2. All tests pass
npm test --workspaces --if-present

# 3. No high-severity vulnerabilities
npm audit --audit-level=high

# 4. Health check responds correctly
curl https://api.altasai.app/health | jq .

# Expected:
# { "ok": true, "service": "altasai-backend", "internalIntelligence": true }

# 5. Auth is enforced
curl -X POST https://api.altasai.app/api/mentor \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}' | jq .error.code

# Expected: "unauthenticated"
```

---

## Firestore Rules Deployment

```bash
# Deploy rules and indexes only (do NOT deploy Firebase Functions)
npx firebase deploy --only firestore:rules,firestore:indexes --project altasai

# Verify serverQuotas deny rule is active:
# Firebase Console → Firestore → Rules tab → look for serverQuotas rule
```

---

## Firebase App Check (required before production)

1. Firebase Console → App Check → Register your app
2. Android: Use Play Integrity provider
3. iOS: Use DeviceCheck provider
4. Web: Use reCAPTCHA v3
5. Set `REQUIRE_APP_CHECK=true` in backend env
6. Test: requests without App Check token should receive 401

---

## Post-Deployment Smoke Test

```bash
# 1. Backend health
curl https://api.altasai.app/health

# 2. Auth required
curl -X POST https://api.altasai.app/api/mentor \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
# Expect: 401 unauthenticated

# 3. Admin endpoint protected
curl https://api.altasai.app/admin/stats.json
# Expect: 401 admin_unauthorized (if ADMIN_METRICS_TOKEN is set)
# Expect: 503 admin_token_missing (if not set — warning: fix before production)
```
