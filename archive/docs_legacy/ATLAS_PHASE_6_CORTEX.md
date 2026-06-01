# Atlas AI Phase 6 Cortex Behavior Intelligence Report

Date: 2026-05-28

## Phase Goal

Build the first deterministic Cortex behavior intelligence layer for Atlas AI.

Core loop:

Signals -> Cortex -> Insight -> Intervention -> Execution -> Report

This phase does not depend on LLM output. Cortex now works with deterministic behavior events, risk scoring, Firestore summaries, Cloud Function triggers, and mobile UI surfaces.

## Cortex Architecture

Cortex now has three layers:

1. Signal events
   - Stored in `users/{userId}/behaviorEvents/{eventId}`.
   - Events can come from tasks, goals, reflection, focus, and later finance/health/digital/security.

2. Deterministic summary state
   - Stored under `users/{userId}/cortex/*`.
   - Written by Cloud Functions.
   - Read by the mobile app.

3. Mobile Cortex UI
   - Cortex dashboard shows current risk, reasons, patterns, weekly placeholders, and recent events.
   - Behavior timeline groups events by date.

The legacy mentor context document `users/{userId}/ai_cortex_state` is still maintained for compatibility with the existing AI Mentor context path.

## Behavior Event Schema

Updated shared mobile type:

```ts
interface BehaviorEvent {
  id?: string;
  userId: string;
  source: 'tasks' | 'goals' | 'reflection' | 'finance' | 'health' | 'digital' | 'security' | 'focus' | 'mentor' | 'system';
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
  occurredAt?: Timestamp;
  signalStrength?: number;
}
```

Compatibility note:

- `occurredAt` and `signalStrength` remain optional because Phase 5 focus sessions already emitted a behavior-ready signal shape. New Cortex code prefers `createdAt`, `severity`, `title`, and `message`.

## Firestore Paths

Behavior events:

- `users/{userId}/behaviorEvents/{eventId}`

Cortex summaries:

- `users/{userId}/cortex/daily`
- `users/{userId}/cortex/weekly`
- `users/{userId}/cortex/patterns`
- `users/{userId}/cortex/riskState`

Legacy compatibility:

- `users/{userId}/ai_cortex_state`

Rules updated:

- Clients can read Cortex summaries.
- Clients cannot write Cortex summaries.
- Clients can create behavior events only if schema validation passes.
- Clients cannot update or delete behavior events.

## Mobile Services Added

Added:

- `apps/mobile/src/services/data/behaviorEvents.ts`
  - `createBehaviorEvent`
  - `listRecentBehaviorEvents`
  - `createTaskBehaviorEvent`

- `apps/mobile/src/services/data/cortex.ts`
  - `getCortexRiskState`
  - `getCortexDocument`
  - `getRecentCortexEvents`
  - `calculateLocalRiskState`

Updated:

- `apps/mobile/src/services/data/index.ts`
- `apps/mobile/src/services/data/focusSessions.ts`
- `apps/mobile/src/types/firestore.ts`

## Cloud Function Support

Rebuilt:

- `functions/src/cortex.ts`

Existing exports remain:

- `onTaskWrite`
- `onGoalWrite`
- `onDailyLogWrite`
- `testCortexRebuild`

Trigger behavior:

- `onTaskWrite`
  - Creates behavior events for task creation, meaningful status change, and carry count changes.
  - Rebuilds Cortex summaries.

- `onGoalWrite`
  - Creates behavior events for goal creation, status changes, and meaningful progress movement.
  - Rebuilds Cortex summaries.

- `onDailyLogWrite`
  - Creates behavior events for new reflections.
  - Emits a medium severity event when energy is low.
  - Rebuilds Cortex summaries.

Noise prevention:

- Events use stable document IDs.
- Triggers ignore unimportant field churn.
- Behavior event writes do not trigger task/goal/reflection triggers, preventing loops.

## Risk Score Logic

Current deterministic signals:

- Pending task count.
- Carried task count.
- Missed or overdue tasks.
- Low reflection energy.
- Missing reflection signal.
- High digital usage.
- Budget overrun.
- Unresolved high-severity security events.

Output:

```ts
{
  executionRiskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  recommendedAction: string;
}
```

Current risk bands:

- `low`: 0-29
- `medium`: 30-54
- `high`: 55-79
- `critical`: 80-100

## Cortex UI

Added:

- `apps/mobile/app/(main)/cortex.tsx`
  - Risk score.
  - Risk level.
  - Recommended intervention.
  - Deterministic reasons.
  - Pattern preview.
  - Weekly summary placeholder.
  - Recent behavior events.

- `apps/mobile/app/(main)/behavior-timeline.tsx`
  - Events grouped by date.
  - Source, severity, title, and message.
  - Atlas Command OS cards and badges.

Updated:

- `apps/mobile/src/constants/routes.ts`
  - Added `CORTEX`.
  - Added `BEHAVIOR_TIMELINE`.

- `apps/mobile/app/(main)/_layout.tsx`
  - Added hidden routes for Cortex and Behavior Timeline.

- `apps/mobile/app/(main)/index.tsx`
  - Command Dashboard Cortex shortcut now opens the Cortex screen.

## Files Changed

Mobile:

- `apps/mobile/src/types/firestore.ts`
- `apps/mobile/src/services/data/behaviorEvents.ts`
- `apps/mobile/src/services/data/cortex.ts`
- `apps/mobile/src/services/data/focusSessions.ts`
- `apps/mobile/src/services/data/index.ts`
- `apps/mobile/src/constants/routes.ts`
- `apps/mobile/app/(main)/index.tsx`
- `apps/mobile/app/(main)/_layout.tsx`
- `apps/mobile/app/(main)/cortex.tsx`
- `apps/mobile/app/(main)/behavior-timeline.tsx`

Functions:

- `functions/src/cortex.ts`

Rules:

- `firestore.rules`

Documentation:

- `docs/ATLAS_PHASE_6_CORTEX.md`

## Remaining Work

High priority:

- Add finance, health, digital, security, and mentor behavior-event emitters.
- Add scheduled Cortex rebuild for users with stale risk state.
- Add Firestore indexes if Firebase requests them for Cortex queries.
- Add Cloud Function tests for event de-duplication and risk scoring.
- Add stronger privacy review for metadata fields before expanding cross-module signals.

Medium priority:

- Replace weekly placeholder with deterministic weekly report.
- Add discipline trend computation from historical risk states and behavior events.
- Add intervention generation from `riskState`.
- Add server-side aggregation for focus session trends.

Low priority:

- Add charts to Cortex dashboard.
- Add filters to Behavior Timeline.
- Add event-source icons after the navigation icon pass.

## Commands Run And Results

Passed:

```powershell
npm run typecheck --workspace=apps/mobile
```

Result:

- Passed. `tsc --noEmit` completed successfully.

Passed:

```powershell
npm run build --workspace=functions
```

Result:

- Passed. Cloud Functions TypeScript build completed successfully.

Passed:

```powershell
npm run typecheck --workspaces --if-present
```

Result:

- Passed. Mobile and legacy API TypeScript checks completed successfully.
