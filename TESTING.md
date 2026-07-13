# AltasAI Testing

Use this checklist after changes that touch mobile launch, auth, tasks, goals, reflection, mentor, backend, or Firebase rules.

## Automated Gates

Run from the repository root:

```bash
npm run typecheck --workspaces --if-present
npm run lint --workspaces --if-present
npm test --workspaces --if-present
npm run api:build
npm run test:rules --workspace=@altasai/backend
npx expo-doctor
npm run evaluate:altasai --workspace=@altasai/backend
npm run ml:evaluate
npm run ml:test
npm audit --audit-level=high
```

`npm audit --audit-level=high` is allowed to fail when advisories are in transitive Expo/Firebase/tooling dependencies that require breaking upgrades. Do not hide those failures; document the advisory count and proposed upgrade path.

## Manual Expo QA

Run the backend first:

```bash
npm run api
```

Run Expo:

```bash
npm run mobile
```

For an Android physical device, set `EXPO_PUBLIC_ALTASAI_API_BASE_URL` to `http://<LAN_IP>:3001` or a tunnel URL before starting Expo. Do not use `localhost` on a physical device.

Smoke these paths:

- Register, log in, log out, and password reset.
- Onboarding completion and initial route selection.
- Profile edit: display name, focus areas, life rhythm, discipline level.
- Create, edit, delete, complete, and carry a task.
- Create a goal, edit progress/title/description, convert a milestone to a task, complete a goal, delete a goal.
- Start and complete a focus session.
- Submit reflection and verify offline feedback does not crash.
- Mentor chat online and with backend stopped.
- Proof review online and with backend stopped.
- Analytics cards and daily summaries.
- Notification permission prompt behavior.

## Emulator Seed Data

Start Firestore/Auth emulators, then seed safe demo data:

```bash
set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
npm run emulator:seed
```

The seed script refuses non-local emulator hosts and never writes without `FIRESTORE_EMULATOR_HOST`.
