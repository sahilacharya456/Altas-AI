# Firestore Rules Test Blocker

## Status: ✅ UNBLOCKED — Java 21.0.11 installed 2026-06-01. All 5 rules tests PASS.

## Exact Error

```
Error: firebase-tools no longer supports Java version before 21.
Please install a JDK at version 21 or above to get a compatible runtime.
```

Detected: `java version "17.0.12"` — need `21.x`.

## Verified Test Results (2026-06-01)

```
PASS src/__tests__/firestore.rules.test.ts
  Firestore security rules
    ✓ users can read and write only their own profile document (848ms)
    ✓ unauthenticated users are denied (83ms)
    ✓ tasks, goals, and reflections enforce ownership and schema (146ms)
    ✓ client cannot write server-owned AI collections (138ms)
    ✓ interventions are client-readable, status-updatable only (107ms)
Tests: 5/5 passed
Java: OpenJDK 21.0.11 (Adoptium Temurin)
```

Run command:
```bash
# Java 21 must be on PATH
npm run test:rules --workspace=@altasai/backend
```

## How to Run (Java 21 installed at Adoptium path)

If PATH still points to old Java, set it for the session:
```bash
export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-21.0.11.10-hotspot"
export PATH="$JAVA_HOME/bin:$PATH"
java -version  # verify: openjdk 21.0.11
npm run test:rules --workspace=@altasai/backend
```

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
