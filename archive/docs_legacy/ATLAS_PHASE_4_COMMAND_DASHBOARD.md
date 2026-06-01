# Atlas AI Phase 4 Command Dashboard Report

Date: 2026-05-27

## Phase Goal

Redesign the main dashboard from a shortcut grid into the daily Atlas AI Command Center. The dashboard now answers:

- What should I do today?
- What is my execution risk?
- What should I avoid?

No client-side AI calls were added. The command briefing is currently computed from local app state and Firestore-backed stores.

## Dashboard Sections Implemented

1. Greeting and daily state
   - Time-aware greeting.
   - User first name from profile or Firebase auth.
   - Current discipline mode badge.
   - Streak and mode status cards.

2. Daily Command Briefing card
   - Shows top priority.
   - Shows execution risk percentage.
   - Shows reason for risk.
   - Shows suggested action.
   - Uses computed local logic, not AI-generated copy.

3. Discipline Score Ring
   - Shows discipline score from analytics dashboard, falling back to profile scores.
   - Shows completed task count, completion progress, and remaining task count.

4. Top 3 Actions
   - Ranks today's pending, in-progress, and carried tasks.
   - Sorting uses priority, carry count, and scheduled time.
   - Empty state directs user to add a task.

5. Risk Warning Card
   - Warns about carried work, too many open tasks, missing task plan, or slipping weekly trend.
   - Uses shared `InsightCard` and `RiskBadge`.

6. Focus Mode CTA
   - Adds a strong `Start Focus Session` button.
   - Currently routes to Tasks because a dedicated focus-session screen does not exist yet.

7. Cortex Insight Preview
   - Shows a local computed insight based on weekly analytics trend.
   - Falls back to morning execution-window guidance when Cortex is not ready.

8. Quick modules
   - Keeps shortcuts secondary:
     - Execute
     - Mentor
     - Cortex
     - Finance
     - Health
     - Shield
     - Profile

## Data Sources Used

Mobile stores:

- `useAuthStore`
  - User display name.
  - Profile display name.
  - Discipline level.
  - Profile score fallback.

- `useTasksStore`
  - Today's task list.
  - Task summary.
  - Carried tasks.
  - Task loading and error state.

- `useGoalsStore`
  - Active goals.
  - High and critical goal pressure used as a light risk factor.

- `useAnalyticsStore`
  - Discipline score.
  - Streak days.
  - Weekly trend.
  - Analytics error state.

Existing route constants:

- `ROUTES.MAIN.TASKS`
- `ROUTES.MAIN.MENTOR`
- `ROUTES.MAIN.ANALYTICS`
- `ROUTES.MAIN.KHATA`
- `ROUTES.MAIN.HEALTH`
- `ROUTES.MAIN.SECURITY`
- `ROUTES.MAIN.PROFILE`

## AI Briefing Status

AI briefing is intentionally not implemented in this phase.

Current behavior:

- Briefing, risk, warning, and Cortex preview are computed locally.
- Dashboard does not block on AI.
- No mobile API key usage was introduced.
- No direct Gemini/OpenAI client call was introduced.

Future AI work:

- Add a Firebase callable `getDailyCommandBriefing`.
- Compute Signals -> Cortex -> Insight -> Intervention server-side.
- Cache the daily briefing in Firestore.
- Return safe fallback data if the callable fails.
- Add server-side auth, rate limiting, and structured logging.

## Files Changed

Dashboard:

- `apps/mobile/app/(main)/index.tsx`

Documentation:

- `docs/ATLAS_PHASE_4_COMMAND_DASHBOARD.md`

## Design System Usage

The dashboard now uses Phase 3 Atlas Command OS components:

- `ScreenContainer`
- `AppHeader`
- `GradientButton`
- `SectionHeader`
- `ActionCard`
- `CommandCard`
- `InsightCard`
- `StatCard`
- `ProgressRing`
- `DisciplineBadge`
- `EmptyState`
- `ErrorState`
- `RiskBadge`

Animation helpers:

- `atlasCardEntrance`

## Remaining Work

High priority:

- Build a real Focus Session screen instead of routing the CTA to Tasks.
- Add Firebase callable AI daily briefing.
- Add Cortex summaries as first-class Firestore documents.
- Add real reflection consistency signal to risk calculation.
- Add budget, health, digital, and security warning signals when those modules expose dashboard-safe summaries.

Medium priority:

- Replace quick module text codes with proper icon components.
- Add reduced-motion handling for dashboard entrance animations.
- Tune risk scoring with real user behavior data.
- Add dashboard snapshot tests or component-level tests once testing conventions are stabilized.

Low priority:

- Add richer bento layouts for large devices/tablets.
- Add a compact dashboard mode for users with many modules enabled.

## Commands Run And Results

Passed:

```powershell
npm run typecheck --workspace=apps/mobile
```

Result:

- Passed. `tsc --noEmit` completed successfully.

Passed:

```powershell
npm run typecheck --workspaces --if-present
```

Result:

- Passed. Mobile and legacy API TypeScript checks completed successfully.
