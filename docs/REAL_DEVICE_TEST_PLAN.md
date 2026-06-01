# AltasAI Real Device Test Plan

Unit tests verify logic. This plan verifies the product works for a real human on a real device.

## Prerequisites

```bash
# Terminal 1: Start backend
cd backend/api && npm run dev
# Verify: curl http://localhost:3001/health → {"ok":true,...}

# Terminal 2: Start Expo
npm run web --workspace=apps/mobile
# OR for physical device: install Expo Go → scan QR code
```

For physical device: backend must be reachable from the device. Update `.env`:
```
EXPO_PUBLIC_ALTASAI_API_BASE_URL=http://192.168.x.x:3001
```

---

## T1: Registration and Onboarding

| Step | Action | Expected | Failure Sign |
|---|---|---|---|
| 1.1 | Open app | Welcome screen loads | Black screen / error |
| 1.2 | Tap "Get Started" | Register screen opens | Nothing happens |
| 1.3 | Enter email + password + name, tap register | Loading → Onboarding | Error stays on Register |
| 1.4 | Select discipline level (Strict) | Option highlights | No visual feedback |
| 1.5 | Select focus areas | Multiple selectable | Only one selectable |
| 1.6 | Select life rhythm, tap "Start AltasAI" | Dashboard loads | Spins forever |

**Screenshot**: Dashboard loaded after onboarding completion.

---

## T2: Home Dashboard

| Step | Action | Expected | Failure Sign |
|---|---|---|---|
| 2.1 | View daily briefing card | Non-empty top priority + risk level | "Loading..." forever |
| 2.2 | View Quick Modules grid | 8 tiles: Execute, Mentor, Cortex, Reports, Goals, Reflect, Shield, Profile | Finance / Khata / News visible |
| 2.3 | Pull to refresh | Dashboard reloads cleanly | Error state appears |

**Screenshot**: Home dashboard with loaded briefing card and 8-tile grid.

---

## T3: Task Creation

| Step | Action | Expected | Failure Sign |
|---|---|---|---|
| 3.1 | Tap "Add task" button | Modal opens | Nothing happens |
| 3.2 | Enter title, set High priority, 30 min | Values set | Input broken |
| 3.3 | Tap "Create Task" | Modal closes, task in list | Error / modal stays |
| 3.4 | Open Home screen | Task visible in Top 3 | Not visible |

**Screenshot**: Task visible in list with priority badge.

---

## T4: Focus Session

| Step | Action | Expected | Failure Sign |
|---|---|---|---|
| 4.1 | Tap task → navigate to Focus | Focus screen with task title, timer starts | Wrong screen / error |
| 4.2 | Wait 30 seconds | Timer shows 00:30 | Timer frozen |
| 4.3 | Pause → Resume | Timer pauses then continues | Unresponsive |
| 4.4 | Set quality to 4, add note | Values accepted | Unresponsive |
| 4.5 | Tap "Complete Task" | Returns to Tasks, task = completed | Error / stays |
| 4.6 | Check task status | Shows completed | Still pending |

**Screenshot**: Timer running with task title visible.

---

## T5: Reflection

| Step | Action | Expected | Failure Sign |
|---|---|---|---|
| 5.1 | Navigate to Reflect (Quick Modules) | Reflection flow opens | Error |
| 5.2 | Complete mood → energy → wins → challenges | Each step loads cleanly | Stuck on any step |
| 5.3 | Submit reflection | Success state / returns to home | Loading forever |
| 5.4 | AI feedback appears (if backend available) | Non-empty mentor feedback text | Empty / error |

**Screenshot**: Reflection submitted with AI insight showing.

---

## T6: AI Mentor

| Step | Action | Expected | Failure Sign |
|---|---|---|---|
| 6.1 | Open Mentor tab | Welcome message: "Ready, [name]..." | Error / empty |
| 6.2 | Send: "I got distracted today. What should I do?" | Typing indicator → response < 20s | Timeout / crash |
| 6.3 | Response structure | Contains Read: / Move: / Why: | Generic quote / empty |
| 6.4 | Response is personalized | References carry tasks / patterns | Copy-paste template |

**Offline test:**
- Stop backend → send message → offline fallback text appears (not a crash)
- Restart backend → next message uses backend normally

**Screenshot**: Mentor response with Read:/Move:/Why: structure visible.

---

## T7: Cortex + Interventions

| Step | Action | Expected | Failure Sign |
|---|---|---|---|
| 7.1 | Open Cortex (Quick Modules) | Behavior signals loaded | Error / blank |
| 7.2 | View productivity state + burnout risk | Non-empty scores and labels | Empty |
| 7.3 | Open Interventions | Active cards shown (if any) | Error |
| 7.4 | Accept an intervention card | Status updates or card removes | Unresponsive |

---

## T8: Weekly Report

| Step | Action | Expected | Failure Sign |
|---|---|---|---|
| 8.1 | Open Reports (Quick Modules) | Screen loads | Error |
| 8.2 | Generate weekly report | Summary + wins + risks appear | Loading forever |
| 8.3 | Offline fallback | Works if backend down | Crash / empty |

---

## T9: Logout and Data Persistence

| Step | Action | Expected | Failure Sign |
|---|---|---|---|
| 9.1 | Open Profile | Name + discipline level correct | Wrong data |
| 9.2 | Tap Logout | Returns to Welcome | Crash |
| 9.3 | Log back in | Dashboard loads | Login fails |
| 9.4 | Check Tasks | Previously created task visible | Empty (data loss) |

---

## Edge Cases

| Scenario | Expected |
|---|---|
| No network on launch | UI loads, shows offline state gracefully |
| No tasks on fresh account | EmptyState with "Add task" CTA |
| 500-char mentor message | Accepted, response returned |
| Rapid double-tap "Send" | Only one message sent |

---

## Pass Criteria

| Tier | Requirement |
|---|---|
| **Demo-ready** | T1–T6 on one device/browser |
| **Beta-ready** | T1–T9 on Android physical device + Expo Web |
| **Production-ready** | All tests + edge cases + App Check enforced |

---

## Bug Report Format

```
Title: [Screen] - [Brief description]
Severity: P0 / P1 / P2
Device: [OS + version]
Steps:
1.
2.
Expected: [what should happen]
Actual: [what happened]
Screenshot: [attach]
```

## Device Coverage Status

| Platform | Tested? |
|---|---|
| Expo Web (Chrome) | Not yet |
| Android physical device | Not yet |
| iOS physical device | Not yet |
| Android emulator | Not yet |
| iOS simulator | Not yet |
