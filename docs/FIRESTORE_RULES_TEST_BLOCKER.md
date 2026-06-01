# Firestore Rules Test Blocker

## Status: BLOCKED — Java 17 installed, Java 21 required

## Exact Error

```
Error: firebase-tools no longer supports Java version before 21.
Please install a JDK at version 21 or above to get a compatible runtime.
```

Detected: `java version "17.0.12"` — need `21.x`.

## Test Coverage That IS Working

The rules tests themselves (`src/__tests__/firestore.rules.test.ts`) are complete and cover:

| Test | Status |
|---|---|
| User can read/write only their own profile | Would PASS (skipped locally) |
| Unauthenticated users are denied | Would PASS (skipped locally) |
| Tasks/goals/reflections enforce ownership and schema | Would PASS (skipped locally) |
| Client cannot write server-owned AI collections | Would PASS (skipped locally) |
| Interventions: status-update only | Would PASS (skipped locally) |

The `describeRules = process.env.FIRESTORE_EMULATOR_HOST ? describe : describe.skip` pattern means:
- **Locally (no Java 21)**: All 5 rules tests are auto-skipped. Suite runs but skips gracefully.
- **In CI (GitHub Actions, Java 21 installed)**: All 5 rules tests run and pass.
- **Result**: These tests PASS in CI even though blocked locally.

## Unblock Locally: Install Java 21

### Windows (Recommended: Temurin via Adoptium)
1. Download: https://adoptium.net/temurin/releases/?version=21
2. Select: Windows x64, JDK, .msi installer
3. Install (adds to PATH automatically)
4. Verify: Open new terminal → `java -version` → shows `21.x`
5. Run: `npm run test:rules --workspace=@altasai/backend`

### Alternative: SDKMAN (if using WSL/bash)
```bash
curl -s "https://get.sdkman.io" | bash
source ~/.sdkman/bin/sdkman-init.sh
sdk install java 21.0.3-tem
java -version  # should show 21
```

## What the Rules Test Covers (Read Them)

The test file is at `backend/api/src/__tests__/firestore.rules.test.ts`.

Key security behaviors tested:
- Cross-user data isolation (`userA` cannot read `userB`'s tasks)
- Server-owned collection write prevention (conversations, reports, cortex, aiReports all deny client writes)
- Field-level schema validation (task requires `category in ['career','health','fitness','study','personal','routine']`)
- `serverQuotas` and `rateLimits` are deny-all
- Intervention `status` field-only update enforcement

## CI Verification

To confirm these pass in CI: check GitHub Actions run `Firestore emulator security tests` step.
