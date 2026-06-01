# AltasAI Backend Deployment Guide

Target platforms: **Render** (recommended), Railway, or Fly.io.

---

## Option A: Render (Recommended)

### Step 1: Prepare the repo
Ensure the repo is pushed to GitHub (see `docs/GIT_SAFETY_CHECK.md`).

### Step 2: Create a Web Service on Render
1. render.com → New → Web Service
2. Connect your GitHub repo
3. Configure:
   - **Root directory**: `backend/api`
   - **Build command**: `npm install && npm run build`
   - **Start command**: `node dist/server.js`
   - **Node version**: 20

### Step 3: Set environment variables in Render dashboard

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | (Render sets this automatically — leave blank) |
| `ALLOWED_ORIGINS` | `https://your-app.com` (no localhost) |
| `FIREBASE_PROJECT_ID` | `altasai` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Paste the minified JSON (single line) |
| `GEMINI_API_KEY` | Your Gemini API key |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `AI_DAILY_QUOTA` | `60` |
| `REQUIRE_APP_CHECK` | `true` (after App Check is configured) |
| `ADMIN_METRICS_TOKEN` | 32-char random token |
| `ML_SERVICE_BASE_URL` | Leave blank or point to ML service if deployed |

**Getting FIREBASE_SERVICE_ACCOUNT_JSON as a single line:**
```bash
# Download from Firebase Console → Project Settings → Service Accounts → Generate key
# Minify the JSON:
cat service-account.json | python3 -m json.tool --compact
# Paste the single-line output into Render's environment variable
```

### Step 4: Get your deployment URL
After Render deploys, you get a URL like `https://altasai-api.onrender.com`.

### Step 5: Update mobile app env
```bash
# apps/mobile/.env (or your EAS build profile)
EXPO_PUBLIC_ALTASAI_API_BASE_URL=https://altasai-api.onrender.com
```

### Step 6: Verify deployment
```bash
curl https://altasai-api.onrender.com/health | python3 -m json.tool
```
Expected:
```json
{
  "ok": true,
  "service": "altasai-backend",
  "firebasePlan": "spark-compatible",
  "internalIntelligence": true,
  "aiProviderConfigured": true
}
```

---

## Option B: Railway

1. railway.app → New Project → Deploy from GitHub repo
2. Set root directory to `backend/api`
3. Railway auto-detects Node.js
4. Set the same environment variables as in Option A
5. Railway assigns a `.railway.app` domain

---

## Option C: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# From backend/api directory
cd backend/api
fly launch --name altasai-api --region sin  # or nearest region
fly secrets set NODE_ENV=production
fly secrets set FIREBASE_SERVICE_ACCOUNT_JSON="$(cat service-account.json | python3 -m json.tool --compact)"
fly secrets set GEMINI_API_KEY=your-key
fly secrets set ADMIN_METRICS_TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
fly deploy
```

---

## Health Check Verification

After any deployment:

```bash
BACKEND=https://your-backend-url.com

# 1. Basic health
curl $BACKEND/health

# 2. Auth enforcement (should fail with 401)
curl -X POST $BACKEND/api/mentor \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
# Expected: {"error":{"code":"unauthenticated"}}

# 3. Admin endpoint security (should fail with 401 if token is set)
curl $BACKEND/admin/stats.json
# Expected: {"error":{"code":"admin_unauthorized"}}

# 4. ML service status
curl $BACKEND/health/ml
# Expected: {"ok":false} if ML service not deployed — this is fine (graceful fallback)
```

---

## Updating ALLOWED_ORIGINS

When you add a new domain (e.g., for Expo web or a custom domain):

```bash
# In Render/Railway dashboard:
ALLOWED_ORIGINS=https://app.altasai.com,https://altasai-api.onrender.com
```

Never include `http://localhost` or `http://127.0.0.1` in production.

---

## Rolling Back

Render and Railway both support one-click rollback to a previous deploy. Always test the health check after rolling back.

---

## Production Checklist (Before First Deploy)

- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` set in hosting environment
- [ ] `ADMIN_METRICS_TOKEN` set (32+ chars)
- [ ] `REQUIRE_APP_CHECK=true` (after App Check is configured)
- [ ] `ALLOWED_ORIGINS` contains only production domains
- [ ] `NODE_ENV=production`
- [ ] Health check passes: `curl /health` returns `ok: true`
- [ ] Auth check passes: unauthenticated request returns 401
- [ ] Firestore rules deployed: `npx firebase deploy --only firestore:rules`
- [ ] Mobile app `EXPO_PUBLIC_ALTASAI_API_BASE_URL` updated to production URL
