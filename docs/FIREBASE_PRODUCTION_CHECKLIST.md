# AltasAI Firebase Production Checklist

## 1. Deploy Firestore Rules and Indexes

Run these commands from the project root. Do NOT deploy Firebase Functions (none exist in the current architecture).

```bash
# Deploy rules and indexes only
npx firebase deploy --only firestore:rules,firestore:indexes --project altasai
```

Expected output:
```
✔  firestore: released rules firestore.rules to cloud.firestore
✔  firestore: deployed indexes in firestore.indexes.json to cloud.firestore
```

**Verify in Firebase Console:**
- Firestore → Rules → check `serverQuotas`, `rateLimits`, `ai_parse_errors` all deny read/write
- Firestore → Indexes → confirm 5 composite indexes are active

---

## 2. Server-Owned Collections (Client Cannot Write)

These collections are written only by the backend Admin SDK. The Firestore rules deny all client writes.

| Collection | Client can read? | Client can write? | Who writes? |
|---|---|---|---|
| `users/{uid}/conversations` | Yes (owner) | No | Backend API (`/api/mentor`) |
| `users/{uid}/reports` | Yes (owner) | No | Backend API (`/api/weekly-report`) |
| `users/{uid}/cortex` | Yes (owner) | No | Backend API (`/api/cortex`) |
| `users/{uid}/aiFeedback` | Yes (owner) | No | Backend API (all routes) |
| `users/{uid}/ai_cortex_state` | Yes (owner) | No | Backend API |
| `users/{uid}/aiReports` | Yes (owner) | No | Backend API |
| `users/{uid}/recommendationFeedback` | Yes (owner) | No | Backend API |
| `users/{uid}/recommendationStats` | Yes (owner) | No | Backend API |
| `users/{uid}/aiGatewayLogs` | Yes (owner) | No | Backend API |
| `serverQuotas` | No | No | Backend API (quota enforcement) |
| `rateLimits` | No | No | Backend API |
| `ai_parse_errors` | No | No | Backend API |

---

## 3. Firebase App Check Setup (Required Before Production)

App Check prevents unauthorized clients from calling your backend APIs and abusing Firebase services.

### Step 1: Enable App Check in Firebase Console
1. Firebase Console → App Check → Get started
2. Register your Android app (if Android build exists):
   - Provider: **Play Integrity**
   - Package name: from `apps/mobile/app.json` → `android.package`
3. Register your iOS app (if iOS build exists):
   - Provider: **DeviceCheck**
   - Bundle ID: from `apps/mobile/app.json` → `ios.bundleIdentifier`
4. Register your Web app:
   - Provider: **reCAPTCHA v3**
   - Register on reCAPTCHA admin console, get site key

### Step 2: Install Expo Firebase App Check
```bash
npx expo install @react-native-firebase/app-check
# OR for Expo Go compatibility:
npx expo install expo-firebase-app-check
```
Check Expo SDK 54 compatibility before installing.

### Step 3: Initialize App Check in mobile app
```typescript
// apps/mobile/src/services/firebase/config.ts
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// After firebase app is initialized:
if (!__DEV__) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('your-recaptcha-site-key'),
    isTokenAutoRefreshEnabled: true,
  });
}
```

### Step 4: Enable enforcement in backend
```bash
# backend/api/.env (production)
REQUIRE_APP_CHECK=true
```

### Step 5: Test
```bash
# Without App Check token → should return 401
curl -X POST https://api.altasai.app/api/mentor \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
# Expected: { "error": { "code": "app_check_required" } }
```

---

## 4. Firebase Auth Configuration

In Firebase Console → Authentication → Settings:

- [ ] **Authorized domains**: Add your production domain (`app.altasai.com` or similar). Remove nothing — this controls which domains can use your Firebase project.
- [ ] **Email enumeration protection**: Enable (prevents guessing registered emails)
- [ ] **Sign-in methods**: Email/Password enabled, others disabled unless planned

---

## 5. Firebase Project Limits (Spark Plan)

AltasAI is designed Spark-compatible (free tier):

| Resource | Spark Limit | Current Usage |
|---|---|---|
| Firestore reads | 50,000/day | Low (user data only) |
| Firestore writes | 20,000/day | Low (user data only) |
| Auth users | Unlimited | N/A |
| Storage | 1 GB | Not used |
| Functions | Not available | Not used (by design) |

If usage exceeds Spark limits, upgrade to Blaze (pay-as-you-go). The architecture is designed to use Blaze only if user volume requires it.
