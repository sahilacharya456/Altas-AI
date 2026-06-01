# AltasAI Firebase Security

## Ownership Model

All user data lives under `users/{userId}`. Client access must satisfy `request.auth.uid == userId`.

Client-owned collections include tasks, goals, daily logs, expenses, khata entries, budgets, health logs, digital usage, focus sessions, security scans, and status updates on interventions.

Server-owned collections include conversations, reports, AI feedback, AI gateway logs, AI reports, Cortex summaries, parse errors, and rate limits.

Recommendation learning collections are also server-owned:

- `users/{userId}/recommendationFeedback/{feedbackId}`
- `users/{userId}/recommendationStats/{statId}`

Clients submit recommendation feedback through the authenticated backend API. Direct client writes are denied by Firestore rules.

## Automated Rules Tests

Rules tests live at:

`backend/api/src/__tests__/firestore.rules.test.ts`

Run with:

```bash
npm run test:rules --workspace=@altasai/backend
```

Local requirement: Java 21+. CI installs Java 21 before running the Firebase emulator.

## Current Local Result

The test file exists, but local execution failed on this machine because Java is 17. The CI workflow is configured with Java 21.

## App Check

Backend App Check verification is available with:

```text
REQUIRE_APP_CHECK=true
```

Clients must send the Firebase App Check token in:

```text
X-Firebase-AppCheck
```

This repository cannot complete Firebase Console provider registration without project credentials.
