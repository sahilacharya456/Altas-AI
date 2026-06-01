# AltasAI Technical Debt

## High Priority

| Item | File | Impact |
|---|---|---|
| `getReactNativePersistence` was broken in firebase v12 | `apps/mobile/src/services/firebase/config.ts` | Fixed: using `inMemoryPersistence` on native. Long-term: evaluate `AsyncStorage` persistence via a supported path. |
| Python ML service is mostly scaffolding | `backend/ml-service/app/` | Low real-world impact while ML service is optional. Must be addressed before promoting ML features to users. |
| `constants/api.ts` contained dead endpoints | `apps/mobile/src/constants/api.ts` | Fixed: removed from barrel. File still exists — delete it when cleaning up. |
| `news.tsx` screen is a complete placeholder | `apps/mobile/app/(main)/news.tsx` | Remove from navigation or implement before LinkedIn post. |

## Medium Priority

| Item | File | Impact |
|---|---|---|
| `ProfileScreen.tsx` is 338 lines | `apps/mobile/src/features/profile/ProfileScreen.tsx` | Hard to maintain. Split before beta. |
| Emoji in Reflection screen | `apps/mobile/src/features/reflection/ReflectionScreen.tsx` | Brand inconsistency with strict mentor positioning. |
| 1 test suite skipped in CI | `backend/api/src/__tests__/firestore.rules.test.ts` | Only runs with Java 21 emulator. Not skipped in GitHub Actions (Java 21 installed). Verify locally. |
| `serverQuotas` was not in Firestore rules | `firestore.rules` | Fixed. Redeploy rules: `npx firebase deploy --only firestore:rules`. |
| Admin endpoints unprotected in dev | `backend/api/src/middleware/adminAccess.ts` | Fixed with warning log. Set `ADMIN_METRICS_TOKEN` before staging. |

## Low Priority

| Item | Impact |
|---|---|
| Console logs in mobile services (`console.warn` in auth store, mentor service) | Verbose in production. Wrap in `__DEV__` guard or use a dedicated mobile logger. |
| `any` types in 18 mobile files | Type safety gaps. Incrementally replace with real types. |
| `require()` call inside `config.ts` catch block | Not ESM-idiomatic. Replace with import-based fallback. |
| Archive folder is large | Old Functions, legacy backend, old docs — `archive/` should be cleaned up or moved to a separate branch. |
