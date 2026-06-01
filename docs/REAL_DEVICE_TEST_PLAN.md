# AltasAI Real Device Test Plan

Unit and integration tests verify logic. This plan verifies the product works for a real human on a real device.

## Setup

```bash
# 1. Start backend
npm run api

# 2. Start mobile app
npm run web --workspace=apps/mobile
# OR for native:
npm run mobile:android  # Android physical device
npm run mobile:ios      # iOS physical device
```

Verify `EXPO_PUBLIC_ALTASAI_API_BASE_URL` points to a reachable backend (not localhost if testing on a physical device — use your LAN IP or a deployed backend URL).

---

## Test Suite: Core Demo Flow

Run this before every demo, beta invite, or LinkedIn post.

### T1: Onboarding Flow
- [ ] Welcome screen renders without errors
- [ ] Register with a new email completes successfully
- [ ] Onboarding steps load: discipline level, focus areas, life rhythm
- [ ] Completing onboarding navigates to Home dashboard
- [ ] Home dashboard shows "Daily command briefing" card with real content

### T2: Task Creation and Ranking
- [ ] Tap "Add task" → modal opens
- [ ] Create task "Test FYP report" — High priority, today, 45 minutes
- [ ] Task appears in Top 3 Actions on home screen
- [ ] Task appears on Tasks screen
- [ ] Carried task indicator appears correctly if `carryCount > 0`

### T3: Focus Session
- [ ] Navigate to Tasks screen → tap a task
- [ ] Focus Mode screen loads with task title
- [ ] Timer starts automatically
- [ ] Pause / Resume buttons work
- [ ] Quality selector (1–5) responds to taps
- [ ] Notes field accepts input
- [ ] "Complete Task" marks task as completed and navigates back
- [ ] "End Session" ends session without completing task
- [ ] Completed task disappears from active list

### T4: Reflection Submission
- [ ] Open Reflection screen
- [ ] Mood slider or option selector responds
- [ ] Energy step responds
- [ ] Wins text input accepts multi-line input
- [ ] Challenges text input accepts input
- [ ] "Submit" saves to Firestore (verify in Firebase Console)
- [ ] After submission, screen shows success state or navigates back
- [ ] Mentor feedback appears (or offline fallback message is shown)

### T5: AI Mentor
- [ ] Open Mentor screen
- [ ] Welcome message appears: "Ready, [name]. Give me the real situation..."
- [ ] Type: "I got distracted today and only finished half my work"
- [ ] Typing indicator appears ("AltasAI is analyzing")
- [ ] Response arrives within 20 seconds
- [ ] Response contains: "Read:", "Move:", "Why:" or similar structure
- [ ] Quick response chips work (tap → fills input)
- [ ] "Offline fallback" badge appears if backend is unreachable

**Offline test**:
- [ ] Stop the backend (`Ctrl+C`)
- [ ] Send a mentor message
- [ ] Offline fallback text appears (not a crash or empty screen)
- [ ] Restart backend — next message works again

### T6: Cortex / Interventions
- [ ] Open Cortex screen (from home or via Quick Modules)
- [ ] Behavior signals load: productivity state, burnout risk, deadline risk
- [ ] No empty state shows when data is available
- [ ] Open Interventions screen
- [ ] Accept an intervention card → status updates
- [ ] Ignore an intervention card → card disappears

### T7: Weekly Report
- [ ] Open Reports screen
- [ ] Tap "Generate weekly report"
- [ ] Report loads with summary, wins, risks, next week actions
- [ ] Offline fallback shows if backend is down

### T8: Profile and Settings
- [ ] Open Profile screen
- [ ] Discipline level shown correctly
- [ ] Logout works: navigates to Welcome screen
- [ ] Re-login restores session correctly

---

## Test Suite: Edge Cases

### E1: No Network
- [ ] App launches without backend running
- [ ] Home dashboard shows graceful error state, not crash
- [ ] Mentor shows offline fallback, not blank screen

### E2: Empty State
- [ ] Fresh account with no tasks → Home shows EmptyState for Top 3
- [ ] Fresh account with no goals → Goals screen shows EmptyState
- [ ] No interventions → correct empty message shown

### E3: Long Input
- [ ] Mentor message with 2000 characters → backend accepts, response arrives
- [ ] Task title with 500 characters → saved correctly

### E4: Auth Expiry
- [ ] Force token expiry (wait 1 hour or manually invalidate in Firebase Console)
- [ ] App re-authenticates automatically on next API call (Firebase handles this)
- [ ] No auth error shown to user

---

## Pass Criteria

**Ready to demo**: T1–T5 pass on at least one physical device.  
**Ready for beta**: T1–T8 + E1–E3 pass on Android and iOS.  
**Production-ready**: All tests pass + App Check enforced + crash reporting active.

---

## Device Coverage Targets

| Platform | Priority | Status |
|---|---|---|
| Expo Web (Chrome) | High | Not formally tested |
| Android physical device | High | Not tested |
| iOS physical device | High | Not tested |
| Android emulator | Medium | Not tested |
| iOS simulator | Medium | Not tested |

Fill in test results here as each device is tested.
