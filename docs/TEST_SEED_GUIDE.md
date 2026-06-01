# AltasAI Test Seed Guide

## Prerequisites

1. **Java 21** installed (Firestore emulator requires Java 21)
2. **Firebase CLI** installed: `npm install -g firebase-tools`
3. **Firebase emulators** installed: `firebase setup:emulators:firestore`

## Start the Emulator

```bash
# From project root
npx firebase emulators:start --only firestore,auth --project altasai-test
```

Emulator UI: http://localhost:4000
Firestore: http://localhost:8080
Auth: http://localhost:9099

## Run the Seed Script

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 GCLOUD_PROJECT=altasai-test node scripts/seed-demo-data.js
```

This creates user `demo_user` (or set `ATLAS_DEMO_UID=qa_active_001` for a named test user).

## Current Seed Data Coverage

| Collection | Seeded | Notes |
|---|---|---|
| `users/{uid}/profile/data` | Yes | Onboarded, strict, real scores |
| `users/{uid}/tasks` | 1 task | Pending, today, high priority |
| `users/{uid}/dailyLogs` | 1 log | Today, mood 4, energy 3 |
| `users/{uid}/goals` | No | TODO: add active goal |
| `users/{uid}/focusSessions` | No | TODO: add completed session |
| `users/{uid}/interventions` | No | TODO: add risk intervention |
| `users/{uid}/conversations` | No | Mentor history — backend-written |

## Expanding the Seed (TODO — Safe to Add)

Add the following to `scripts/seed-demo-data.js` before the `console.log` at the end:

```javascript
// Add active goal
await user.collection('goals').doc('demo_goal_1').set({
  userId: uid,
  title: 'Launch AltasAI portfolio',
  description: 'Ship the demo before the deadline',
  category: 'career',
  priority: 'critical',
  status: 'active',
  progress: 35,
  milestones: [],
  aiBreakdown: [],
  createdAt: now,
  updatedAt: now,
});

// Add completed focus session
await user.collection('focusSessions').add({
  userId: uid,
  taskId: 'demo_task_1',
  plannedMinutes: 45,
  durationMinutes: 38,
  quality: 4,
  status: 'completed',
  notes: 'Good concentration, minimal distractions',
  createdAt: now,
  updatedAt: now,
});

// Add carried overdue task
const yesterday = new admin.firestore.Timestamp(now.seconds - 86400, 0);
await user.collection('tasks').doc('demo_task_overdue').set({
  userId: uid,
  title: 'Overdue: Write project report',
  category: 'study',
  priority: 'critical',
  status: 'pending',
  scheduledDate: yesterday,
  estimatedMinutes: 120,
  isCarried: true,
  carryCount: 2,
  source: 'manual',
  createdAt: yesterday,
  updatedAt: now,
});
```

## Cleaning Up After Tests

```bash
# Clear all data for a specific user in emulator:
firebase firestore:delete /users/qa_active_001 --recursive --project altasai-test

# Or wipe everything and re-seed:
firebase emulators:start --only firestore --import ./emulator-data --export-on-exit ./emulator-data
```

## Running Firestore Rules Tests Against Emulator

**Blocked: requires Java 21 (Java 17 is installed).**

When Java 21 is installed:
```bash
npm run test:rules --workspace=@altasai/backend
```

To install Java 21 on Windows:
1. Download from https://adoptium.net/temurin/releases/?version=21
2. Install the MSI
3. Verify: `java -version` shows 21.x
4. Re-run: `npm run test:rules --workspace=@altasai/backend`

The test file `backend/api/src/__tests__/firestore.rules.test.ts` uses `describeRules` which auto-skips when `FIRESTORE_EMULATOR_HOST` is not set, so it won't break other tests.

## CI/CD Note

The GitHub Actions CI (`/.github/workflows/ci.yml`) installs Java 21 via `setup-java@v4`:
```yaml
- uses: actions/setup-java@v4
  with:
    distribution: temurin
    java-version: 21
```

Firestore rules tests pass in CI even though they are blocked locally.
