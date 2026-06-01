# Atlas AI Demo Script

Date: 2026-05-28

## 3-Minute Demo Script

### 0:00 - 0:30: Positioning

Atlas AI is not a todo app. It is a personal AI discipline operating system.

The product loop is:

```text
Signals -> Cortex -> Insight -> Intervention -> Execution -> Report
```

Atlas watches execution signals such as tasks, goals, reflections, focus sessions, spending, health/routine, digital usage, and security. Then it predicts execution risk and tells the user what to do next.

### 0:30 - 1:15: Command Dashboard

Open the dashboard.

Say:

> This is the daily command center. It answers the first question a serious user has: what should I do today, what is my risk, and what should I avoid?

Show:

- greeting and discipline mode
- Atlas Core visual
- daily command briefing
- execution risk
- discipline score
- top 3 actions
- interventions
- focus CTA
- Cortex preview

### 1:15 - 2:00: Execution System

Open Tasks and Focus Mode.

Say:

> Atlas does not only store work. It tracks execution behavior: pending, in progress, completed, carried, cancelled, focus minutes, carry count, and linked goals.

Show:

- task sections
- quick complete
- start focus
- task detail
- focus session review

### 2:00 - 2:40: Cortex and Interventions

Open Cortex and Behavior Timeline.

Say:

> Cortex is the behavior intelligence layer. It does not require an LLM. It computes deterministic risk from real user signals.

Show:

- risk score
- risk reasons
- recommended action
- behavior events
- intervention cards

### 2:40 - 3:00: Reports and AI Safety

Open Reports or Mentor.

Say:

> AI calls stay server-side through Firebase Cloud Functions. If the provider is unavailable, Atlas uses explicit offline fallback instead of faking intelligence.

End:

> The current product is demo-ready for portfolio and FYP evaluation. It is not production-launched yet because App Check, monitoring, and full UI smoke testing still need completion.

## 7-Minute Demo Script

### 0:00 - 0:45: Problem

Most users do not fail because they lack task lists. They fail because they do not see execution risk early enough.

Atlas AI is built for discipline, not motivation. It detects carry loops, overload, missed reflection, low energy, distraction, finance risk, and security issues before they become invisible failure patterns.

### 0:45 - 1:45: Product Loop

Explain:

- Signals are user behaviors.
- Cortex turns those signals into deterministic risk.
- Insight makes risk understandable.
- Intervention creates a specific card/action.
- Execution happens through tasks, goals, and focus mode.
- Reports close the loop.

### 1:45 - 2:45: Dashboard

Demo the Command Dashboard.

Talking points:

- Daily Command Briefing is safe even without AI.
- Top 3 actions are computed from priority, due date, and carry debt.
- Discipline score is visible but not gamified.
- Interventions make Atlas proactive.
- Quick modules are secondary.

### 2:45 - 3:45: Execute System

Demo tasks, task detail, goals, and focus.

Talking points:

- Carry count is important because repeated carry is a failure signal.
- Focus sessions convert intent into measured execution.
- Task and goal writes feed Cortex through Cloud Functions.

### 3:45 - 4:45: Cortex

Demo Cortex and Timeline.

Say:

> Cortex is deterministic first. That matters because a serious product cannot depend entirely on LLM output.

Explain risk inputs:

- pending tasks
- carried tasks
- overdue tasks
- missed reflection
- low energy
- digital overuse
- budget risk
- security risk

### 4:45 - 5:30: AI Engine

Show mentor/reports.

Explain:

- mobile never calls Gemini/OpenAI directly
- Cloud Functions enforce auth and rate limits
- AI gateway retrieves controlled memory
- safety filter redacts likely secrets
- structured schemas validate outputs
- offline fallback is explicit

### 5:30 - 6:15: Support Modules

Show finance, health, digital, and security.

Say:

> These are not random mini apps. Each module is a signal source for Cortex.

Examples:

- overspending becomes finance risk
- low energy becomes execution risk
- digital overuse becomes distraction risk
- risky links become security risk

### 6:15 - 7:00: Security and Readiness

Explain:

- Firestore rules enforce user-scoped access.
- server-only collections deny client writes.
- AI keys are server-side only.
- legacy backend is not production mobile path.
- App Check and monitoring remain production blockers.

Close:

> Atlas AI is demo-ready and portfolio-ready. It has the architecture of a real product, with a clear path from FYP showcase to startup MVP.

## FYP Presentation Talking Points

- The novelty is behavior intelligence, not a todo CRUD app.
- The core loop is visible in both code and UI.
- Firebase is the production backend.
- AI is orchestrated server-side with fallbacks.
- Cortex is deterministic and testable.
- Interventions make the product proactive.
- Security rules and auth are part of the architecture, not an afterthought.

## How To Explain Cortex

Cortex is the system that transforms behavior into risk.

It reads user signals, builds behavior events, computes risk, summarizes patterns, and recommends action. It works without an LLM so the product remains useful when AI is unavailable.

## How To Explain The AI Engine

The AI engine is not a custom-trained LLM. It is an orchestration layer.

It has:

- gateway
- model router
- prompt engine
- memory retrieval
- safety filter
- structured schemas
- agents
- offline fallback

## How To Explain The Intervention Engine

The intervention engine is the proactive layer.

It detects:

- task carry loops
- overload
- low energy
- missed reflection
- budget risk
- digital overuse
- security risk

Then it creates an intervention card with a specific action.

## How To Explain Security

Security choices:

- Firebase Auth gates identity.
- Firestore rules enforce `users/{uid}` ownership.
- AI keys are server-side only.
- server-only collections deny client writes.
- rate limits protect callable Functions.
- App Check is planned before production.

## How To Explain Business Value

Atlas can become a premium personal operating system for execution.

Potential customers:

- students
- founders
- professionals
- self-improvement users
- accountability/coaching users

Premium value:

- AI mentor
- weekly reports
- advanced Cortex patterns
- proactive interventions
- private memory controls
- exportable performance reviews
