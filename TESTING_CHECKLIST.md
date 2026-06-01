# AltasAI Testing Checklist

## Automated (Run Before Every Deploy)

- [ ] `npm run typecheck --workspaces --if-present` — PASS
- [ ] `npm test --workspaces --if-present` — PASS (38/38 tests passing across mobile + backend)
- [ ] `npm run build --workspace=@altasai/backend` — PASS
- [ ] `npm run evaluate:altasai --workspace=@altasai/backend` — verify all model scores
- [ ] `npm run ml:train && npm run ml:evaluate && npm run ml:test` — PASS
- [ ] `npm audit --audit-level=high` — 0 high severity vulnerabilities

## Firestore Rules (Requires Java 21)

- [ ] `npm run test:rules --workspace=@altasai/backend` — PASS after every `firestore.rules` edit
- [ ] `serverQuotas` deny rule deployed: `npx firebase deploy --only firestore:rules,firestore:indexes`

## Manual QA — Core Loop (Before Demo)

- [ ] Register new user → onboarding completes → lands on home dashboard
- [ ] Create task → task appears in Top 3 → task can be completed
- [ ] Start focus session → timer runs → session logged on completion
- [ ] Submit reflection → mentor feedback appears (or offline fallback is shown)
- [ ] Open Mentor → send message → response returned (or offline fallback)
- [ ] Cortex card on home loads real insight (not empty/loading state)
- [ ] Intervention card: accept and ignore both update status in Firestore
- [ ] Weekly report generates without errors (offline fallback if Gemini unavailable)
- [ ] Logout → app returns to welcome screen → re-login works

## Manual QA — Edge Cases

- [ ] Log in without network → app shows appropriate offline state, not a crash
- [ ] Mentor rate-limit exceeded → 429 error shown gracefully
- [ ] Firestore rules: attempt to write to `conversations` collection directly → blocked
- [ ] Firestore rules: attempt to write to `serverQuotas` → blocked
- [ ] Backend without `GEMINI_API_KEY` → all routes return internal fallback, never 500

## Production Gate

Do NOT deploy unless:

- All automated checks pass
- Core loop manual QA passes on a real device (not just Expo web)
- `REQUIRE_APP_CHECK=true` is set
- `ADMIN_METRICS_TOKEN` is set
- Crash reporting is configured
- `FIREBASE_SERVICE_ACCOUNT_JSON` is set in the hosting environment (not in any committed file)
