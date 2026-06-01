# AltasAI Incident Response

## Severity Levels

| Level | Definition | Response Time |
|---|---|---|
| P0 | App completely down for all users | 30 minutes |
| P1 | Core feature broken (auth, mentor, tasks) | 2 hours |
| P2 | Non-critical feature broken (reports, analytics) | Next day |
| P3 | Cosmetic or minor issue | Next sprint |

---

## P0 Runbook: Backend Down

**Symptom**: `GET /health` returns non-200 or times out.

```bash
# Step 1: Check backend status
curl https://api.altasai.app/health

# Step 2: Check Render/Railway logs
# Render: Dashboard → Service → Logs
# Railway: Dashboard → Deployments → most recent → Logs

# Step 3: Check for recent deploy
# If a recent deploy caused it → Render: "Rollback" button
# Railway: "Rollback to previous deployment"

# Step 4: Check Firebase service account
# If logs show "invalid credentials" → rotate FIREBASE_SERVICE_ACCOUNT_JSON
# See docs/SECRET_ROTATION_GUIDE.md

# Step 5: Verify after fix
curl https://api.altasai.app/health
# Must return: { "ok": true }
```

---

## P0 Runbook: Firebase Auth Down

**Symptom**: Users cannot log in; backend returns `"Invalid or expired Firebase ID token"`.

```bash
# Step 1: Check Firebase status
# https://status.firebase.google.com/

# Step 2: Check Auth usage limits
# Firebase Console → Authentication → Usage
# If quota hit → wait for daily reset or upgrade to Blaze

# Step 3: Check if service account key is expired
# Firebase Console → Project Settings → Service Accounts
# If key is revoked/expired → generate new key, update FIREBASE_SERVICE_ACCOUNT_JSON
```

---

## P1 Runbook: Gemini API Failing

**Symptom**: All mentor/report responses are `"offline": true` in production.

```bash
# Step 1: Check Gemini status
# https://status.cloud.google.com/ → Vertex AI / Generative AI

# Step 2: Check quota
# Google AI Studio → API usage dashboard
# If daily quota hit → AltasAI automatically falls back (no user action needed)

# Step 3: Check API key validity
# Google Cloud Console → APIs & Services → Credentials
# If key is invalid → generate new key, update GEMINI_API_KEY

# Note: AltasAI has full internal fallback — mentor still works, just without Gemini enhancement
# The internal pipeline is the primary intelligence layer
```

---

## P1 Runbook: Firestore Rules Blocking Legitimate Writes

**Symptom**: Users report tasks, reflections, or goals are not saving.

```bash
# Step 1: Check Firestore rules
# Firebase Console → Firestore → Rules → Rules Playground
# Test with the specific operation that's failing

# Step 2: Check rules version
# Compare local firestore.rules with deployed rules in Firebase Console

# Step 3: Redeploy if local rules are newer
npx firebase deploy --only firestore:rules --project altasai

# Step 4: Verify
# Firebase Console → Firestore → Rules Playground
# Simulate: auth.uid = "test-user", request.path = /users/test-user/tasks/task-1
```

---

## P2 Runbook: High AI Quota Failure Rate

**Symptom**: Many users hitting 429 quota_exceeded.

```bash
# Option 1: Increase quota
# backend/api/.env (or hosting environment):
AI_DAILY_QUOTA=120   # increase from 60

# Option 2: Check for abuse
# Look for users with unusually high request counts in Firestore:
# serverQuotas collection → filter by userId

# Option 3: Implement rate limit per bucket
# Current quota is shared across all AI endpoints per user per day
# Consider separate limits for mentor vs reports
```

---

## Communication Template

For user-facing incidents (P0/P1), post a brief update:

```
Status update [TIME]:
AltasAI [feature] is experiencing issues.
Your data is safe and no data has been lost.
Expected resolution: [TIME].
Cause: [brief description]
```

---

## Post-Incident Review

After any P0 or P1 incident:
1. What happened?
2. When did it start / when was it detected?
3. What was the user impact?
4. What fixed it?
5. What can prevent it next time?

Document in a file: `docs/incidents/YYYY-MM-DD-incident-title.md`
