# AltasAI — Production Deployment Guide

## Backend → Railway (10 minutes)

### 1. Create Railway account
Go to https://railway.app → sign up → New Project → Deploy from GitHub

### 2. Connect your repo
Railway detects the `railway.json` at the root and the `Dockerfile` in `backend/api/`.

### 3. Set environment variables in Railway dashboard
Copy every key from `backend/api/.env.example` and fill in real values:

| Variable | Where to get it |
|---|---|
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Console → Project Settings → Service Accounts → Generate new private key → copy entire JSON |
| `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |
| `ADMIN_METRICS_TOKEN` | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `STRIPE_SECRET_KEY` | https://dashboard.stripe.com/apikeys (use live key for production) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → Add endpoint → copy signing secret |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Stripe Dashboard → Products → create Pro product → copy Price ID |
| `ALLOWED_ORIGINS` | Your Expo app URL (e.g. `https://altasai.app,exp://...`) |
| `NODE_ENV` | `production` |
| `REQUIRE_APP_CHECK` | `true` (after setting up App Check in Firebase Console) |

### 4. Get your Railway URL
Railway gives you a URL like `https://altasai-backend-production.up.railway.app`.
Set this as `EXPO_PUBLIC_ALTASAI_API_BASE_URL` in your mobile `.env`.

### 5. Configure Stripe webhook
Stripe Dashboard → Webhooks → Add endpoint:
- URL: `https://your-railway-url.railway.app/stripe/webhook`
- Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

---

## Mobile → TestFlight (iOS) or Play Store (Android)

### Prerequisites
- Apple Developer account ($99/year): https://developer.apple.com/programs/
- EAS CLI: `npm install -g eas-cli`
- Login: `eas login`

### 1. Update eas.json
Edit `apps/mobile/eas.json`:
- Set your `appleId`, `ascAppId`, `appleTeamId` in the submit section
- Set `EXPO_PUBLIC_ALTASAI_API_BASE_URL` to your Railway URL in the production build profile

### 2. Update app.json
Make sure `ios.bundleIdentifier` is `com.altasai.app` (or your custom ID).

### 3. Build for iOS
```bash
cd apps/mobile
eas build --platform ios --profile production
```
This takes ~15 minutes. EAS uploads your credentials automatically.

### 4. Submit to TestFlight
```bash
eas submit --platform ios --profile production
```

### 5. Build for Android
```bash
eas build --platform android --profile production
eas submit --platform android --profile production
```

---

## Python ML Service → Railway (optional)

If you want the ML service running in production:

1. Add a second Railway service pointing to `backend/ml-service/`
2. Use a `Dockerfile` in that directory (create with: `FROM python:3.12-slim`, `COPY . .`, `RUN pip install -r requirements.txt`, `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]`)
3. Set `ML_SERVICE_BASE_URL` in your backend Railway service to the ML service's Railway URL

Without the ML service, AltasAI falls back to the TypeScript internal models — the app still works perfectly.

---

## Firestore Security Rules

Deploy your security rules before going live:
```bash
npx firebase deploy --only firestore:rules,firestore:indexes --project altasai
```

---

## Checklist before going live

- [ ] `NODE_ENV=production` set in Railway
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON` set (real service account, not dev)
- [ ] `GEMINI_API_KEY` set and tested
- [ ] `ADMIN_METRICS_TOKEN` set (32+ chars random)
- [ ] `REQUIRE_APP_CHECK=true` (after configuring App Check)
- [ ] `ALLOWED_ORIGINS` contains only your production domains (no localhost)
- [ ] Stripe live keys set (not test keys)
- [ ] Stripe webhook configured and verified
- [ ] Firebase rules deployed
- [ ] TestFlight/Play Store internal testing done with real users
- [ ] `EXPO_PUBLIC_ALTASAI_API_BASE_URL` points to Railway URL (not localhost)
