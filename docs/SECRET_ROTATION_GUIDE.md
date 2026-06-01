# AltasAI Secret Rotation Guide

Use this guide when a secret is compromised, expired, or accidentally exposed.

---

## Firebase Service Account Key

**Symptoms**: Leaked in git history, error logs, or shared accidentally.

**Steps**:
1. Firebase Console → Project Settings → Service Accounts
2. Find the affected key → click "..." → Delete key
3. Generate new key: "Generate new private key"
4. Update `FIREBASE_SERVICE_ACCOUNT_JSON` in your hosting environment (Render/Railway)
5. Redeploy the backend
6. Verify: `GET /health` returns `{ "ok": true }`

**Impact**: All existing Firebase Admin SDK calls will fail until the new key is deployed.

---

## Gemini API Key

**Symptoms**: Unexpected usage on your Google Cloud billing dashboard, or key was committed.

**Steps**:
1. Google Cloud Console → APIs & Services → Credentials
2. Find the key → click "Regenerate" or delete and create new
3. Update `GEMINI_API_KEY` in hosting environment
4. Redeploy backend
5. Verify: Send a mentor message, confirm `provider: "gemini"` in response

**Impact**: All Gemini-enhanced responses will use internal fallback until new key is deployed.

---

## Firebase Web API Key (EXPO_PUBLIC_FIREBASE_API_KEY)

**Note**: Firebase web API keys are designed to be public. They are not secret. Access is controlled by Firebase Security Rules and authorized domains.

**If compromised** (e.g., someone is abusing your Firebase Auth quota):
1. Google Cloud Console → APIs → Credentials → your Firebase key
2. Add "Application restrictions" → HTTP referrers (limit to your app domains)
3. This will not break existing legitimate users but will block abuse

---

## ADMIN_METRICS_TOKEN

**Symptoms**: Unauthorized access to `/metrics` or `/admin/stats` endpoints.

**Steps**:
1. Generate new token: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Update `ADMIN_METRICS_TOKEN` in hosting environment
3. Redeploy backend
4. Verify: old token returns 401, new token returns 200

---

## If Secrets Are in Git History

If a secret was committed and pushed to a public repository:

```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove the specific file from all history
git filter-repo --path apps/mobile/.env --invert-paths
git filter-repo --path backend/api/.env --invert-paths

# Force push (coordinate with any collaborators first)
git push --force-with-lease origin main
```

**Then immediately**:
1. Rotate all secrets exposed in that file (see sections above)
2. Enable GitHub secret scanning on the repo
3. Check if the secret was indexed by any public scanning services (GitHub secret scanning, GitGuardian)
