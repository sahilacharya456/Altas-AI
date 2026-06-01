# AltasAI Git Safety Check

## Current State (Verified 2026-06-01)

- Git repository: **initialized** (`git init` completed)
- Initial commit: **bfb7be3** — "Initial AltasAI commit — demo-ready MVP"
- Working tree: **clean** (`git status --porcelain` returns empty)
- Secrets tracked: **none** (verified by pattern scan)

## What Is Protected

| File | Status | Rule |
|---|---|---|
| `apps/mobile/.env` | NOT tracked | `apps/mobile/.gitignore` line 15 |
| `backend/api/.env` | NOT tracked | root `.gitignore` line 38 (`*.env`) |
| `.claude/` | NOT tracked | root `.gitignore` line 116 (added) |
| `google-services.json` | NOT tracked | both `.gitignore` files |
| `GoogleService-Info.plist` | NOT tracked | both `.gitignore` files |

## Pre-Push Safety Check (Run Every Time)

```bash
# 1. Confirm no .env files are staged
git status --short | grep "\.env$"
# Should print nothing

# 2. Scan staged changes for secret patterns
git diff --cached | grep -E "AIzaSy|private_key|-----BEGIN|GEMINI_API_KEY=[\w]"
# Should print nothing

# 3. Confirm gitignore is working
git check-ignore -v apps/mobile/.env backend/api/.env
# Should show the matching gitignore rule for each

# 4. Full verification
git diff --cached --name-only | xargs grep -l "private_key_id\|client_secret\|api_key" 2>/dev/null
# Should print nothing (or only .example files which contain placeholder values)
```

## Firebase Web API Key — Is It a Secret?

The key in `apps/mobile/.env` (`EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...`) is the **Firebase web API key**. This is intentionally public — it identifies your Firebase project to the SDK. It is not a service account key.

**It is safe on disk in `.env`, as long as `.env` is never committed.**

The actual security comes from:
1. Firebase Security Rules (server-side enforcement)
2. Authorized domains in Firebase Console (limits which URLs can use the key)
3. App Check (blocks non-app traffic)

**If this key is leaked publicly**: Add HTTP referrer restrictions in Google Cloud Console → APIs & Services → Credentials.

## Firebase Service Account — Where Should It Live?

`FIREBASE_SERVICE_ACCOUNT_JSON` is a **real secret** (private key). It must never appear in the repo.

Current backend `.env` has it **commented out** (placeholder only):
```
# FIREBASE_SERVICE_ACCOUNT_JSON={...}
```

For production: store this in Render/Railway as a secret environment variable, not in any file.

## If Secrets Were Accidentally Committed

See `docs/SECRET_ROTATION_GUIDE.md` for step-by-step rotation procedures.

## Setting Up a Remote Repository (GitHub)

```bash
# 1. Create a new repo on github.com (do NOT initialize with README)
# 2. Add remote:
git remote add origin https://github.com/yourusername/altasai.git

# 3. Final check before pushing
git diff HEAD --name-only | grep -E "\.env$"
# Should be empty

# 4. Push
git push -u origin master

# 5. After pushing, enable GitHub security features:
#    Settings → Code security → Secret scanning → Enable
#    Settings → Code security → Dependency graph → Enable
#    Settings → Code security → Dependabot alerts → Enable
```
