# AltasAI Backend Setup

## Install And Build

From the repository root:

```bash
npm install
npm run api:build
```

Create `backend/api/.env` from `backend/api/.env.example`.

## Run Locally

```bash
npm run api
```

The API listens on `PORT`, default `3001`.

Mobile env for local desktop/simulator:

```bash
EXPO_PUBLIC_ALTASAI_API_BASE_URL=http://localhost:3001
```

Mobile env for Android physical devices:

```bash
EXPO_PUBLIC_ALTASAI_API_BASE_URL=http://<LAN_IP>:3001
```

Find the LAN IP on the same Wi-Fi network as the phone. If the network blocks LAN routing, expose the backend with a tunnel and use the tunnel HTTPS URL.

## AI And Offline Behavior

AI provider keys stay in `backend/api/.env` only:

```bash
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
```

When Gemini or the ML service is unavailable, the backend and mobile services return internal fallback responses for mentor chat, goal breakdown, reflection feedback, proof review, rewards, and subscription status instead of crashing core flows.

## ML Service

The Node API calls the Python ML service through:

```bash
ML_SERVICE_BASE_URL=http://127.0.0.1:8001
ML_SERVICE_TIMEOUT_MS=3500
```

If the ML service is down, reward calls and mentor behavior use fallback paths.

## Stripe

Stripe is optional for local development. Leave these blank to keep Checkout disabled:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_MONTHLY_PRICE_ID=
STRIPE_TEAM_MONTHLY_PRICE_ID=
```

The mobile app never stores Stripe secret keys. Checkout URLs are created by `backend/api`.

## Firebase Emulator

Start emulators:

```bash
firebase emulators:start --only firestore,auth
```

Seed demo data:

```bash
set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
npm run emulator:seed
```
