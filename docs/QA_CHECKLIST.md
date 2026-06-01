# AltasAI QA Checklist

Use before every demo, beta user invite, or code push to production.

## Automated (Run Every Time — Takes 60 Seconds)

```bash
npm run typecheck --workspaces --if-present   # Must pass: 0 errors
npm test --workspaces --if-present             # Must pass: 46/46 tests
npm run build --workspace=@altasai/backend     # Must pass: clean build
npx eslint src --ext .ts,.tsx --max-warnings 0 # (from apps/mobile directory)
npm audit --audit-level=high                   # Must pass: 0 high severity
```

Current baseline: ✅ 0 errors, ✅ 46/46 pass, ✅ build clean, ✅ 0 lint warnings, ✅ 0 high vulns

## Manual (Before Demo)

### Core Loop
- [ ] Register → Onboarding → Dashboard loads
- [ ] Create task → appears in Top 3 on home
- [ ] Focus session starts → timer counts → "Complete Task" works
- [ ] Reflection submits → success state
- [ ] Mentor responds with Read:/Move:/Why: structure
- [ ] Offline fallback: stop backend → mentor still responds

### Navigation Safety
- [ ] Quick Modules grid shows: Execute, Mentor, Cortex, Reports, Goals, Reflect, Shield, Profile
- [ ] Finance/Khata NOT visible on home screen
- [ ] Health NOT visible on home screen
- [ ] News route → shows "Coming in a future update" screen
- [ ] Scan Link route → shows "Coming in a future update" screen

### State Handling
- [ ] Fresh account (no tasks) → EmptyState shows with CTA
- [ ] No interventions → correct empty message
- [ ] Logout → Welcome screen (no stale state)
- [ ] Re-login → data persists

## Before Beta User Invite (First Time Only)

- [ ] `git status --porcelain` → empty (no uncommitted secrets)
- [ ] `git diff HEAD --name-only | grep "\.env$"` → empty
- [ ] `git check-ignore -v apps/mobile/.env` → shows gitignore rule
- [ ] `npx firebase deploy --only firestore:rules,firestore:indexes`
- [ ] Backend deployed with `FIREBASE_SERVICE_ACCOUNT_JSON` set
- [ ] Backend `/health` returns `{"ok":true}` from production URL
- [ ] Mobile `.env` `EXPO_PUBLIC_ALTASAI_API_BASE_URL` points to production backend
- [ ] Firestore rules emulator test: `npm run test:rules --workspace=@altasai/backend`

## Production Gate (Before Any Public Announcement)

- [ ] `REQUIRE_APP_CHECK=true` in production backend
- [ ] `ADMIN_METRICS_TOKEN` set in production backend
- [ ] Crash reporting configured (Sentry DSN added to mobile `.env`)
- [ ] `ALLOWED_ORIGINS` contains only production domains (no localhost)
- [ ] Health check verified from outside the server network
- [ ] Admin endpoint `GET /admin/stats.json` returns 401 without token
