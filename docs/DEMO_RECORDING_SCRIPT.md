# AltasAI Demo Recording Script

A clean 3-minute demo for LinkedIn, GitHub README, or investor conversations.

## Setup Before Recording

1. Start backend: `npm run api` in `backend/api/`
2. Start mobile: `npm run web --workspace=apps/mobile`
3. Open Chrome → `http://localhost:8081`
4. Create a **fresh demo account** (never use real personal data in recordings)
5. Set Chrome zoom to 75% for mobile viewport
6. Use Chrome's device emulator (F12 → Toggle device toolbar → iPhone 14 Pro)
7. Clear all previous demo account data or use a new email each time

---

## Script (3 minutes, 10 scenes)

### Scene 1: Welcome (10 seconds)
**Show**: AltasAI welcome screen
**Say**: "This is AltasAI — a personal execution system that tells you what to do today and holds you accountable to yesterday."
**Do**: Tap "Get Started"

---

### Scene 2: Register (15 seconds)
**Show**: Registration form
**Say**: "Sign up takes 30 seconds."
**Do**: Fill in demo name + email + password, tap register

---

### Scene 3: Onboarding (20 seconds)
**Show**: Discipline level selection
**Say**: "AltasAI asks what kind of accountability you want. Strict means it calls out every excuse. Mentor means it guides you. Builder rhythm for people shipping products."
**Do**: Select Strict → Career + Study → Builder → Complete

---

### Scene 4: Home Dashboard (30 seconds)
**Show**: Full home dashboard
**Say**: "This is the command center. The AI has already analyzed your state — before you type a single thing."
**Highlight**: 
- Daily briefing card: "This is the execution risk for today."
- Cortex insight card: "This runs entirely on AltasAI's internal intelligence — no API call needed."
- Quick Modules grid: "Eight modules, focused on execution."

---

### Scene 5: Create Task + Focus (30 seconds)
**Show**: Create task → navigate to Focus
**Say**: "Create one task — the most important thing you'll do today."
**Do**: 
1. Tap "Add task" → "Finish AltasAI FYP chapter" → High priority → 60 min → Create
2. Tap the task → Focus Mode opens
3. Timer runs: "Focus mode is single-task execution. No multitasking."
4. After 5 seconds: tap Complete Task → returns to dashboard

---

### Scene 6: Reflection (25 seconds)
**Show**: Reflection flow
**Say**: "At the end of the day, AltasAI asks you to be honest. Not about what went well — about what actually happened."
**Do**:
1. Open Reflection (Quick Modules → Reflect)
2. Mood: 3/5 → Energy: 3/5
3. Wins: "Completed one chapter section"
4. Challenges: "Spent 45 minutes on social media"
5. Submit → AI feedback appears

---

### Scene 7: AI Mentor (30 seconds)
**Show**: Mentor screen
**Say**: "The AI mentor knows your data. It doesn't give you a motivational quote — it gives you the next move based on what you actually did."
**Do**:
1. Open Mentor tab
2. Type: "I wasted time today and only finished half my work."
3. Response arrives — show Read:/Move:/Why: structure
4. Pause on: "This is not GPT-4 answering a generic question. This is AltasAI reading your carry tasks, your reflection, your focus session."

---

### Scene 8: Cortex Intelligence (20 seconds)
**Show**: Cortex screen
**Say**: "The Cortex shows the behavior signal behind the advice. Productivity state, burnout risk, deadline risk — all computed from your actual usage data."
**Do**: Navigate to Cortex → scroll through signals

---

### Scene 9: Offline Demo (15 seconds)
**Show**: Stop backend → send mentor message
**Say**: "AltasAI's intelligence is deterministic. When the server is unavailable, it still gives you a specific next action — no AI API needed."
**Do**: Stop backend → send message → offline fallback appears
**Restart backend**

---

### Scene 10: Closing (10 seconds)
**Show**: Home dashboard again
**Say**: "AltasAI: tasks, focus, reflection, mentor, cortex. One execution system."
**Final shot**: Home dashboard with loaded briefing

---

## Recording Checklist

Before starting:
- [ ] Backend running and health check passes
- [ ] Demo account created (never real personal data)
- [ ] No browser notifications
- [ ] Screen at 75% zoom, iPhone 14 Pro emulator
- [ ] Quiet environment or use screen recorder without audio

Tools:
- **macOS**: QuickTime Player (screen record) or Loom
- **Windows**: Xbox Game Bar (Win+G) or Loom
- **All**: OBS Studio (free, professional)

After recording:
- [ ] Trim dead time between scenes
- [ ] Add captions if posting to LinkedIn (auto-generated is fine)
- [ ] Keep total length under 3 minutes for LinkedIn
- [ ] Export at 1080p minimum

---

## What NOT to Show in the Demo

| Screen | Reason |
|---|---|
| Finance / Khata | Postponed, ComingSoon screen |
| News Lab | Postponed |
| Device Safety | Postponed |
| Python ML service routes | Backend-only scaffolding |
| Firebase Console | Internal |
| `.env` files | Never |
| Real user data | Privacy |

---

## Talking Points for Q&A

**"Why not just use ChatGPT?"**
AltasAI's value is context. ChatGPT doesn't know you carried the same task for 3 days. AltasAI does. The advice is different.

**"How is the AI different?"**
AltasAI runs a 21-component deterministic intelligence pipeline before Gemini ever runs. The recommendation exists before any LLM call. Gemini only improves the wording.

**"What's the stack?"**
Expo React Native → Firebase Auth/Firestore → Express backend → optional Python ML service. Spark-plan compatible (no Firebase Functions needed).

**"Is it production-ready?"**
It's demo-ready with verified tests and clean code. Production deployment requires App Check configuration and crash reporting — both documented.
