# AltasAI Git Setup Guide

This project is not yet a git repository. Follow these exact steps before pushing anywhere.

## Step 1: Initialize and verify secrets are not tracked

```bash
cd /path/to/ALTAS_AI

git init
git add .

# CRITICAL: Verify no secrets are staged before committing
git status | grep -E "\.env$|\.env\.|service.account|google-services|\.pem|\.key|\.p12"
```

If any `.env` files appear in `git status`, stop immediately:

```bash
# Remove from staging without deleting the file
git reset HEAD apps/mobile/.env
git reset HEAD backend/api/.env

# Double-check .gitignore is working
git check-ignore -v apps/mobile/.env
git check-ignore -v backend/api/.env
# Both should print the gitignore rule — if silent, the file is NOT ignored
```

## Step 2: Rotate the Firebase API key

The file `apps/mobile/.env` contains a real Firebase web API key that has been on disk. While this key is low-risk (it is the public Firebase web config, not a service account key), best practice is to rotate it:

1. Go to Firebase Console → Project Settings → General → Web API Key
2. Note: Firebase web API keys cannot be regenerated without creating a new project. They are restricted by Firebase Security Rules and authorized domains.
3. Instead, add HTTP referrer restrictions in Google Cloud Console → APIs → Credentials.

The key in `apps/mobile/.env` is intentionally a client-side key (Firebase web config). It is safe to be in a `.env` file as long as that file is gitignored. **Never put it in an `EXPO_PUBLIC_*` variable that gets baked into a public build if you want to restrict it.**

## Step 3: Check for the backend service account

`backend/api/.env` contains `FIREBASE_SERVICE_ACCOUNT_JSON`. Before any commit:

```bash
cat backend/api/.env | grep "FIREBASE_SERVICE_ACCOUNT_JSON"
# Should show: # FIREBASE_SERVICE_ACCOUNT_JSON=... (commented out)
# OR just the placeholder from .env.example
```

If it contains a real service account private key:
1. Do NOT commit this file.
2. Revoke the key: Firebase Console → Project Settings → Service Accounts → Revoke.
3. Generate a new key and store it in your hosting environment (Render/Railway secret), never in the repo.

## Step 4: Initial commit

```bash
git add .
git commit -m "Initial AltasAI commit — demo-ready MVP

- Expo React Native app with Firebase Auth + Firestore
- Express backend with deterministic AI pipeline
- Feature flags for MVP scope
- 43 tests passing

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

## Step 5: Verify on GitHub

After pushing to GitHub:

1. Navigate to the repo on GitHub
2. Search the repo for: `firebase_api_key` or `FIREBASE_SERVICE_ACCOUNT` or `GEMINI_API_KEY`
3. If any secrets are found, remove them from git history with `git-filter-repo` or GitHub's secret scanning

## Step 6: Enable GitHub secret scanning

In the GitHub repo → Settings → Code security and analysis → Secret scanning → Enable.

This will alert you if any secrets appear in future commits.

---

## Quick Pre-Commit Checklist

Before every `git push`:

- [ ] `git status` shows no `.env` files
- [ ] `git diff --staged | grep -i "api_key\|private_key\|secret\|password"` returns nothing
- [ ] All tests pass: `npm test --workspaces --if-present`
- [ ] Typecheck passes: `npm run typecheck --workspaces --if-present`
