# AltasAI Launch Roadmap

## P0 — Critical Fixes (Done)

| Fix | Status |
|---|---|
| Env var mismatch (`ATLAS` vs `ALTASAI`) | DONE |
| `serverQuotas` Firestore security rule | DONE |
| Firebase config `@ts-ignore` + broken import | DONE |
| Dead `constants/api.ts` removed from barrel | DONE |
| Duplicate `MentorScreen.tsx` removed | DONE |
| Backend `.env.example` missing vars | DONE |
| Admin endpoint dev warning | DONE |

## P1 — Before Demo / GitHub / LinkedIn

- [ ] Add `apps/mobile/.env` to `.gitignore` (real Firebase API key is committed to disk)
- [ ] Mark `news.tsx` screen as coming soon or remove from navigation
- [ ] Verify `resolveInitialRoute` covers all auth edge cases with Firestore emulator test
- [ ] Add `ADMIN_METRICS_TOKEN` to local `.env` for all developers

## P2 — Before Beta Users

- [ ] Set `REQUIRE_APP_CHECK=true` in production deployment
- [ ] Configure crash reporting (Firebase Crashlytics or Sentry)
- [ ] Split `ProfileScreen.tsx` (338 lines) into 2 screens
- [ ] Remove emoji from `ReflectionScreen.tsx` (brand inconsistency)
- [ ] Gate Python ML service vision/CV routes behind a feature flag or remove from production
- [ ] Verify push notification delivery end-to-end on a physical device
- [ ] Run Firestore rules emulator test in CI (requires Java 21 — already in CI, verify locally)

## P3 — Startup Scale

- [ ] App Check enforcement everywhere
- [ ] Real contextual bandit reward signal from user recommendation acceptance
- [ ] Weekly execution loop metric in analytics dashboard
- [ ] Onboarding flow A/B test
- [ ] Stripe or RevenueCat for premium tier
- [ ] Production domain (`api.altasai.app`) deployed on Render or Railway

## North Star Metric

**Weekly completed execution loops per active user**  
`task_selected → focus_started → task_completed_or_reflected → intervention_accepted`

Track in Firebase Analytics or a simple counter in Firestore `users/{uid}/analytics/weeklyLoops`.
