# AltasAI Demo Flow

## The One Demo That Matters

**Goal**: Show a real human going from "I don't know what to do today" to "I have a clear next action" in under 3 minutes.

---

## Demo Script (3 minutes)

### Step 1: Welcome Screen (10 seconds)
- Open AltasAI
- Show the welcome screen: "Execute without excuses."
- Tap "Get Started"

### Step 2: Register (20 seconds)
- Register with a demo email
- Set display name

### Step 3: Onboarding (30 seconds)
- Select discipline level: **Strict**
- Select focus areas: **Career + Study**
- Select life rhythm: **Builder**
- Complete onboarding → lands on **Home Dashboard**

### Step 4: Home Dashboard (30 seconds)
- Show the "Daily command briefing" card
  - Point out: "AltasAI already knows execution risk from your behavior — not from manual input"
  - Show the Cortex insight: "This is internal AI, no Gemini key needed"
- Show the Top 3 Actions section: "Ranked by carry debt, deadline, and priority"

### Step 5: Create a Task (20 seconds)
- Tap "Add task"
- Create: "Finish FYP chapter 3" — High priority, today, 60 min
- Task appears in Top 3 list

### Step 6: Focus Mode (20 seconds)
- Tap the task → Focus Mode opens
- Timer starts automatically
- Show quality selector, notes field
- Pause session (simulating end)
- Show "End session" → saves 25 min focus log

### Step 7: Reflection (30 seconds)
- Navigate to Reflection
- Complete a 3-step reflection:
  - Mood: 3/5 (medium)
  - Wins: "Finished one chapter section"
  - Challenges: "Got distracted twice"
- Submit → Show "AltasAI analyzing" → Mentor feedback appears

### Step 8: AI Mentor (30 seconds)
- Navigate to Mentor
- Send: **"I got distracted today and only finished half my work. What should I do?"**
- AI responds with specific next action (read from internal plan, optionally enhanced by Gemini)
- Point out: "This is not a chatbot. It knows you've been distracted, knows your carry tasks, knows your deadline risk."

### Step 9: Weekly Report / Cortex (20 seconds)
- Open Cortex screen
- Show behavior signal summary: burnout risk, deadline risk, habit consistency
- "AltasAI built this from your tasks, focus, and reflection — no manual summary needed."

---

## What to Avoid Showing

| Screen | Reason |
|---|---|
| News | Placeholder, not connected to execution loop |
| Khata/Finance | Not MVP |
| Device Safety | Secondary feature |
| Scan Link | Secondary feature |
| Behavior Timeline | Advanced — not impactful in 3-min demo |
| Health module | Secondary for demo |

---

## Demo Talking Points

- "AltasAI is not a to-do app. It's an execution accountability system."
- "The AI knows your pattern, not just your task list."
- "It works offline. The internal intelligence engine runs without any API key."
- "The mentor doesn't give motivational quotes. It gives the next move."
- "Every piece of advice is traceable to a real behavior signal."

---

## Demo Prerequisites

- Backend running: `npm run api`
- Mobile running: `npm run web --workspace=apps/mobile`
- Firebase configured in `apps/mobile/.env`
- Gemini key optional (demo works without it)
