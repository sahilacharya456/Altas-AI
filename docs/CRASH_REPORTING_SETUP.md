# AltasAI Crash Reporting Setup

## Chosen Approach: Sentry for Expo (React Native)

**Why Sentry over Firebase Crashlytics:**
- Sentry works with Expo Go and managed workflow (no native build required for JS crashes)
- Free tier: 5,000 errors/month (sufficient for beta)
- Easier setup than Crashlytics which requires EAS Build + native configuration
- Works immediately without `expo prebuild`

**Why not Crashlytics:**
- Requires native build via EAS Build
- Adds `@react-native-firebase/crashlytics` which is a native module
- Not compatible with Expo Go dev testing

---

## Setup Steps (Manual — Requires Sentry Account)

### Step 1: Create Sentry account and project
1. Go to sentry.io → Sign up (free)
2. Create Organization: "AltasAI"
3. Create Project: React Native
4. Copy the DSN (looks like: `https://xxx@yyy.ingest.sentry.io/zzz`)

### Step 2: Install Sentry SDK
```bash
cd apps/mobile
npx expo install @sentry/react-native
```

Verify Expo SDK 54 compatibility:
```bash
npx expo install --check
```

### Step 3: Initialize Sentry

Add to `apps/mobile/app/_layout.tsx`:
```typescript
import * as Sentry from '@sentry/react-native';

// Initialize before any other code
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: !__DEV__,           // disable in dev to avoid noise
  tracesSampleRate: 0.1,       // 10% performance tracing for beta
  debug: false,
});
```

Add to `apps/mobile/.env`:
```
EXPO_PUBLIC_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
```

Add to `apps/mobile/.env.example`:
```
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### Step 4: Update ErrorBoundary

In `apps/mobile/src/components/ErrorBoundary.tsx`:
```typescript
import * as Sentry from '@sentry/react-native';

// Replace the TODO comment:
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  if (!__DEV__) {
    Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }
  console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
}
```

### Step 5: Test crash reporting
```typescript
// In any screen, add temporarily to test:
import * as Sentry from '@sentry/react-native';
Sentry.captureMessage('Test event from AltasAI');
// Check Sentry dashboard for the event
// Remove this test code after verifying
```

---

## Backend Error Tracking

The backend already has structured JSON logging via `src/utils/logger.ts`. For production:

### Option 1: Render/Railway built-in log streaming
- Render: Dashboard → your service → Logs tab
- Filter for `"level":"error"` entries

### Option 2: Add Sentry to backend (optional)
```bash
cd backend/api
npm install @sentry/node
```

In `src/server.ts` (before app.listen):
```typescript
import * as Sentry from '@sentry/node';
if (env.nodeEnv === 'production' && process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
}
```

In `src/lib/http.ts` errorHandler (in the 500 branch):
```typescript
if (process.env.SENTRY_DSN) Sentry.captureException(error);
```

---

## What Crash Reporting Will Catch

| Error Type | Caught by | Notes |
|---|---|---|
| React component crashes | Sentry + ErrorBoundary | JS-level, works in Expo Go |
| Unhandled Promise rejections | Sentry auto | Enabled by default |
| Backend 500 errors | Backend logger + Sentry (optional) | Logged to Render |
| Firebase Auth failures | Backend logger | Auth middleware catches |
| Gemini API failures | Backend logger | Already logged as warn |
| Quota exhaustion | Backend logger | Already logged, 429 returned |

---

## Not Covered Until Native Build

- Native crashes (memory, segfault) — requires EAS Build + Crashlytics
- Performance tracing for native modules — requires EAS Build
- Source maps for minified native bundles — requires EAS Build

For beta with Expo Go or Expo Web: Sentry JS-level reporting is sufficient.
