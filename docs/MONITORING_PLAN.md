# AltasAI Monitoring Plan

## What to Monitor and Why

AltasAI's reliability depends on four things: Firebase Auth, Firestore, the Express backend, and the Gemini fallback path. If any of these fail silently, users get blank screens or stale data. Monitor what matters.

---

## Backend Monitoring (Immediate — No Cost)

### Built-in Metrics Endpoint

The backend exposes Prometheus-format metrics at `/metrics` (requires `ADMIN_METRICS_TOKEN`):

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://api.altasai.app/metrics
```

Key metrics:
- `altasai_requests_total` — request count by route and status
- `altasai_errors_total` — error count by route
- `altasai_request_duration_ms` — latency by route
- `altasai_uptime_seconds` — server uptime
- `altasai_quota_exceeded_total` — quota hit rate

### Admin Stats Dashboard

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" https://api.altasai.app/admin/stats.json
```

Returns JSON with route-level stats and process memory.

### Alerts to Set Up (Manual, Free)

**Option 1: Render/Railway built-in alerts**
- Service restart alert → email when the backend crashes and restarts
- High response time alert → email if P95 latency > 5 seconds

**Option 2: UptimeRobot (free tier)**
- Monitor `GET /health` every 5 minutes
- Alert if response code is not 200 or body does not contain `"ok":true`
- URL: `https://uptimerobot.com` → free account → add monitor

---

## AI Fallback Rate Monitoring

Track how often Gemini is unavailable. High fallback rate = Gemini API problem or quota exhausted.

The `/health` endpoint shows `aiProviderConfigured`. Each mentor response includes `"offline": true/false` and `"provider": "internal/gemini"`.

**Manual check:**
```bash
curl -H "Authorization: Bearer TOKEN" https://api.altasai.app/admin/stats.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
routes = data.get('routes', [])
mentor = next((r for r in routes if 'mentor' in r.get('route', '')), None)
if mentor: print('Mentor requests:', mentor)
"
```

---

## Mobile Crash Monitoring

### Recommended: Sentry for Expo (Free Tier)

Sentry supports Expo and React Native without requiring EAS or native builds for basic JS crash reporting.

**Setup steps (manual — requires Sentry account):**

1. Create account at sentry.io → New Project → React Native
2. Install:
```bash
npx expo install @sentry/react-native
```
3. Initialize in app entry point (`apps/mobile/app/_layout.tsx`):
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
});
```
4. Update `ErrorBoundary.tsx`:
```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  Sentry.captureException(error, { extra: errorInfo });
}
```

**Cost**: Free tier covers 5,000 errors/month — sufficient for beta.

### Alternative: Firebase Crashlytics

Firebase Crashlytics requires a native build (not compatible with Expo Go). Use only if building with EAS Build.

**If using EAS Build:**
```bash
npx expo install @react-native-firebase/crashlytics
```
Then follow: https://rnfirebase.io/crashlytics/usage

---

## Key Metrics Dashboard (Spreadsheet for Beta)

During the first 30 days of beta, track these manually in a Google Sheet:

| Date | DAU | Onboarding Completions | Tasks Created | Focus Sessions | Reflections | Mentor Prompts | Gemini Fallback Rate | Crashes |
|---|---|---|---|---|---|---|---|---|
| 2026-06-01 | - | - | - | - | - | - | - | - |

**North Star**: Weekly completed execution loops per active user.  
A loop = task_created → focus_started → reflection_submitted.

---

## Quota Failure Monitoring

The backend returns `429 quota_exceeded` when a user exhausts their daily AI limit.

**Track this**: If quota failures are high, either raise `AI_DAILY_QUOTA` or implement a paid tier.

**Manual check**: Look for 429 responses in Render/Railway logs.

---

## Login Failure Monitoring

Firebase Auth handles authentication. Monitor:
- Firebase Console → Authentication → Usage tab
- Unusual spikes in failed sign-in attempts → potential abuse

---

## Incident Response (P1)

If a user reports AltasAI is broken:

1. **Check backend health** — `curl /health`
2. **Check Render/Railway logs** — look for 500 errors
3. **Check Firebase Console** — Auth and Firestore status
4. **Check Gemini quota** — Google AI Studio → usage dashboard
5. **Rollback if needed** — Render/Railway one-click rollback

See `docs/INCIDENT_RESPONSE.md` for the full runbook.
