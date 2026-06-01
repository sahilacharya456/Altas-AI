# Atlas AI Final Product Report

Date: 2026-05-28

## Product Overview

Atlas AI is a personal AI discipline operating system. It is not positioned as a todo app, chatbot, finance tracker, or habit tracker. The product is built around a command loop:

```text
Signals -> Cortex -> Insight -> Intervention -> Execution -> Report
```

The current codebase now supports this loop in a demo-ready form through Firebase Auth, Firestore, Cloud Functions, deterministic Cortex scoring, proactive interventions, execution workflows, and server-side AI orchestration.

## Problem Statement

Most productivity products fail because they store intent but do not detect execution failure. Users can keep adding tasks while carried work, low energy, digital overuse, spending risk, or security issues quietly undermine the day.

Atlas AI addresses this by turning behavior signals into decisions and interventions.

## Solution

Atlas AI answers the daily execution question:

> What should I do today, what is my risk, and what should I avoid?

The product combines:

- daily command dashboard
- task and goal execution system
- focus sessions
- behavior events
- Cortex risk scoring
- intervention cards
- AI mentor and reports
- finance, health, digital, and security discipline modules

## Core Features

- Welcome/auth/onboarding for discipline setup.
- Command Dashboard for daily state, risk, top actions, and interventions.
- Tasks with pending, in-progress, carried, completed, cancelled states.
- Goals with milestones, progress, and AI breakdown support.
- Focus Mode with timer, quality review, and behavior emission.
- Mentor chat through Firebase callable Functions only.
- Cortex dashboard with risk score, reasons, patterns, weekly placeholder, and events.
- Behavior timeline grouped by recent signal events.
- Reports list and daily/weekly report details.
- Finance/Khata discipline tracking.
- Health/routine tracking without medical claims.
- Digital usage / distraction intelligence.
- Security/Shield link scanning and device checklist.
- Profile/settings with explicit future privacy/account controls.

## App Flow

1. User opens Atlas.
2. Dashboard explains today’s priority, risk, warning, and next action.
3. User executes tasks or starts focus.
4. Actions emit behavior events.
5. Cortex rebuilds risk state.
6. Intervention engine creates active cards.
7. Reports summarize daily/weekly performance.

## Module Breakdown

| Module | Current Status | Cortex Link |
| --- | --- | --- |
| Auth/Onboarding | Functional | Creates profile and discipline baseline |
| Dashboard | Strong | Reads tasks, goals, analytics, interventions |
| Tasks | Strong | Triggers task behavior events and Cortex rebuild |
| Goals | Strong | Triggers goal behavior events and Cortex rebuild |
| Focus | Strong | Emits focus completion behavior event |
| Mentor | Functional | Uses callable server AI with offline fallback |
| Cortex | Strong demo layer | Deterministic risk and timeline |
| Interventions | Strong demo layer | Rule engine works without AI |
| Reports | Functional | Deterministic reports with AI enhancement path |
| Finance | Functional | Emits finance behavior events |
| Health | Functional but visually older | Emits health behavior events |
| Digital | Functional but visually older | Emits digital behavior events |
| Security | Functional | Emits security events and behavior signals |
| News | Lab/future feature | Not core value |
| Profile/Settings | Functional | Future privacy controls are explicit |

## AI Engine Architecture

AI is server-side only.

```text
Mobile -> Firebase callable Function -> AI Gateway -> Safety Filter
       -> Safe Memory Retrieval -> Prompt Engine -> Model Router
       -> Gemini or Offline Fallback -> Structured Schema Validation
```

Implemented pieces:

- `functions/src/ai/gateway.ts`
- `functions/src/ai/modelRouter.ts`
- `functions/src/ai/promptEngine.ts`
- `functions/src/ai/memory.ts`
- `functions/src/ai/safety.ts`
- `functions/src/ai/schemas.ts`
- agents for command, mentor, planner, reflection, finance, security, report, and intervention

Final safety adjustment:

- AI prompt identity no longer claims custom model training.
- malformed AI JSON logs no longer store raw model output.
- new safety-filter tests cover secret redaction and injection warning detection.

## Cortex Architecture

Firestore paths:

```text
users/{uid}/behaviorEvents/{eventId}
users/{uid}/cortex/daily
users/{uid}/cortex/weekly
users/{uid}/cortex/patterns
users/{uid}/cortex/riskState
users/{uid}/ai_cortex_state
```

Risk scoring signals:

- pending task count
- carried task count
- overdue/missed task count
- low energy from reflection
- missed reflection
- digital usage above goal
- budget overrun
- unresolved high-severity security risk

Cortex answers:

- what happened through behavior events
- what pattern exists through pattern summaries
- what risk exists through risk state
- what to do next through recommended action

## Intervention Engine

Firestore path:

```text
users/{uid}/interventions/{interventionId}
```

Implemented deterministic rules:

- task carry loop
- task overload
- low energy
- reflection avoidance
- budget risk
- digital distraction
- security risk

Interventions support:

- active
- accepted
- ignored
- completed
- expired

Anti-duplicate behavior uses stable document IDs and expiry checks.

## Firestore Database Model

Main user-scoped collections:

- `profile`
- `tasks`
- `goals`
- `focusSessions`
- `dailyLogs`
- `behaviorEvents`
- `cortex`
- `interventions`
- `reports`
- `analytics`
- `expenses`
- `khata`
- `budgets`
- `budgetAlerts`
- `healthLogs`
- `digitalUsage`
- `securityEvents`
- `securityScans`
- `linkAnalysis`
- `aiFeedback`
- `conversations`

Server-only/global collections:

- `rateLimits`
- `ai_parse_errors`

## Security Model

- Users can read/write only their own user-scoped data.
- Cortex summaries, reports, AI feedback, conversations, rate limits, and parse errors deny client writes.
- Firestore rules validate key fields and document size for major collections.
- AI keys are not present in mobile source and must remain server-side.
- Mobile AI services call Firebase callable Functions only.
- Legacy backend remains documented as non-production.

Remaining production blockers:

- App Check not configured.
- Secret scanning not enforced in repository settings.
- Rules tests require local JDK 21.
- No abuse dashboard for AI usage yet.
- No crash reporting or production analytics integration yet.

## UI/UX Design System

Atlas Command OS includes:

- dark graphite / ink navy base
- refined emerald/teal intelligence accent
- premium typography and spacing
- `ScreenContainer`
- `AppHeader`
- `SectionHeader`
- `SurfaceCard` / `GlassCard`
- `CommandCard`
- `InsightCard`
- `StatCard`
- `ProgressRing`
- `RiskBadge`
- `DisciplineBadge`
- `MetricPill`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `GradientButton`
- `SecondaryButton`
- `IconButton`
- `ListItem`
- `TimelineItem`
- `ReportCard`
- `InterventionCard`
- `FocusSessionCard`
- `AtlasCoreVisual` / `CortexCoreVisual`

Final polish removed the global cyber particle wrapper and toned down Mentor visuals.

## Screenshots Placeholders

Add screenshots after local Firebase demo env is configured:

- Welcome with Atlas Core
- Command Dashboard
- Cortex
- Tasks
- Focus Mode
- Reports
- Finance discipline
- Security Shield

## Testing Status

Passed:

- `npm run typecheck --workspaces --if-present`
- `npm run typecheck --workspace=apps/mobile`
- `npm run build --workspace=functions`
- `npm run build --workspace=backend/api_legacy`
- `npm test --workspaces --if-present`

Blocked locally:

- `npm run test:rules --workspace=functions`
- Reason: Firebase Tools requires JDK 21+.

## Future Roadmap

- Replace remaining `@ts-nocheck` screens.
- Migrate older support screens fully to Atlas Command OS.
- Add UI smoke tests.
- Configure App Check, Crashlytics, Analytics, and AI usage monitoring.
- Expand Cortex with trend confidence and personalized execution windows.
- Implement PDF/report export.
- Add production-grade notification preferences.
- Prepare screenshots, demo seed data, and app store preview assets.

## Monetization Plan

Potential tiers:

- Free: tasks, goals, focus, basic Cortex risk.
- Pro: AI mentor, weekly reports, interventions, advanced analytics.
- Premium: finance/health/digital/security intelligence, export, cross-device memory.
- Team/coach future: accountability dashboards for coaches or mentors with consent.
