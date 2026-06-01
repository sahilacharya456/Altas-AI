# AltasAI Manual QA Bug Template

Use this template for every bug found during manual device testing.

## Bug Report Template

```
---
BUG-[NUMBER]: [SCREEN] - [BRIEF TITLE]

Severity:   P0 (crash/data loss) | P1 (core feature broken) | P2 (UX issue) | P3 (cosmetic)
Status:     OPEN | IN_PROGRESS | FIXED | VERIFIED | WONTFIX
Found:      [Date]
Fixed:      [Date or blank]
Tested on:  [Android X.X / iOS X.X / Expo Web Chrome]

Description:
[What went wrong. One paragraph maximum.]

Steps to Reproduce:
1. [Exact step 1]
2. [Exact step 2]
3. [Exact step 3]

Expected Result:
[What should have happened]

Actual Result:
[What actually happened]

Screenshot/Video:
[Attach or leave blank]

Root Cause (if known):
[File path and line number if identified]

Fix Applied:
[PR/commit/branch or blank]
---
```

## Example Bug Report

```
---
BUG-001: FOCUS - Timer does not start automatically when task loaded

Severity:   P1
Status:     FIXED
Found:      2026-06-01
Fixed:      2026-06-01
Tested on:  Android 13, Pixel 7

Description:
After navigating to the Focus screen via a task tap, the timer shows 00:00 
but does not begin counting. The session ID is created but elapsed time stays 
at zero until the user manually taps Resume.

Steps to Reproduce:
1. Log in with any account
2. Create a task with 30 min estimate
3. Tap the task to open Focus mode
4. Observe timer

Expected Result:
Timer starts automatically (isRunning = true) and increments each second

Actual Result:
Timer shows 00:00 and stays frozen. Elapsed seconds never increment.

Root Cause:
apps/mobile/app/(main)/focus.tsx — setIsRunning(true) called but interval 
useEffect depends on isRunning, race condition on initial render.

Fix Applied:
Set isRunning(true) in useEffect after session ID is set, not before.
---
```

## Severity Guide

| Severity | Description | Examples |
|---|---|---|
| P0 | App crashes or data is lost | Crash on mentor send, task not saved to Firestore |
| P1 | Core user journey is blocked | Can't create task, reflection won't submit, mentor returns empty |
| P2 | Feature works but UX is broken | Button hard to tap, text overflows, empty state missing |
| P3 | Cosmetic or minor | Wrong color, slight misalignment, typo |

## After Filing a Bug

1. Add to `docs/ACTIVE_BUGS.md` if not fixed immediately
2. Create a test in the appropriate test file that would catch regression
3. Verify fix on the same device/platform where bug was found
4. Mark status VERIFIED after confirming fix
