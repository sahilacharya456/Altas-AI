# AltasAI Beta Launch Checklist

## Gate 1: Code Health (Must Pass)

- [x] `npm run typecheck --workspaces --if-present` — PASS
- [x] `npm test --workspaces --if-present` — 43/43 tests passing (backend + mobile)
- [x] `npm run build --workspace=@altasai/backend` — PASS
- [x] `npx eslint src --ext .ts,.tsx --max-warnings 0` — PASS (0 warnings)
- [ ] `npm audit --audit-level=high` — 17 moderate (ws package, transitive via Expo, not exploitable here)
- [ ] `npm run test:rules --workspace=@altasai/backend` — Requires Java 21 locally

## Gate 2: Security

- [ ] Initialize git repository
- [ ] Confirm `.env` is gitignored: `git check-ignore -v apps/mobile/.env backend/api/.env`
- [ ] Deploy Firestore rules: `npx firebase deploy --only firestore:rules,firestore:indexes`
- [ ] Verify `serverQuotas` deny rule is active via Firebase Console
- [ ] Set `REQUIRE_APP_CHECK=true` in production environment
- [ ] Set `ADMIN_METRICS_TOKEN` (16+ chars) in production environment
- [ ] Remove `localhost` from `ALLOWED_ORIGINS` in production

## Gate 3: Demo Flow

- [ ] Welcome → Register → Onboarding completes without error
- [ ] Home dashboard loads with cortex insight
- [ ] Task creation → appears in Top 3
- [ ] Focus session starts and ends, logs to Firestore
- [ ] Reflection submission → mentor feedback returned
- [ ] Mentor chat with "what should I do?" → specific response (not generic advice)
- [ ] Weekly report / Cortex screen loads
- [ ] Offline fallback works: stop backend, mentor still responds

## Gate 4: Production Infrastructure

- [ ] Backend deployed to Render/Railway with production env vars
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` set in hosting environment (not in code)
- [ ] `GEMINI_API_KEY` set (optional but recommended)
- [ ] Health check: `GET /health` returns `{ ok: true, internalIntelligence: true }`
- [ ] Crash reporting configured (Firebase Crashlytics or Sentry)
- [ ] Firebase App Check enabled in Console for Android + iOS

## Gate 5: Analytics & Metrics

- [ ] `productEvents.ts` is being called at key points (verified in logs)
- [ ] Core funnel events fire: `onboarding_completed`, `task_created`, `focus_started`, `reflection_submitted`, `mentor_prompt_submitted`
- [ ] Weekly execution loop counter is being tracked (even if manual initially)
- [ ] 7-day retention plan is in place (push notifications scheduled)

## Gate 6: First Beta Users

- [ ] Recruit 5–10 target users (final-year students, junior devs, indie builders)
- [ ] Each user completes at least 1 full execution loop
- [ ] Feedback collected after day 3 and day 7
- [ ] At least 1 user completes a weekly report cycle

## North Star Metric

**Weekly completed execution loops per active user.**  
Target: 2+ loops/week per retained user after day 7.

## Known Remaining Blockers

1. App Check not configured (production only)
2. Crash reporting not set up
3. `test:rules` requires Java 21 locally (passes in CI)
4. Real-device E2E tests not yet formalized
5. Python ML service vision/CV routes are stubs (gated behind flags)
