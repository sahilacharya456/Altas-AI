# Atlas AI Phase 8 Intervention Engine Report

Date: 2026-05-28

## Phase Goal

Make Atlas proactive by creating deterministic intervention cards when behavior risk is detected.

The engine works without an AI provider. AI is only used opportunistically to improve intervention wording after deterministic rule detection. If AI is unavailable, the deterministic card is still created.

## Firestore Schema

Collection:

- `users/{userId}/interventions/{interventionId}`

Mobile type:

```ts
interface Intervention {
  id?: string;
  userId: string;
  type: 'task' | 'goal' | 'finance' | 'health' | 'digital' | 'security' | 'reflection' | 'focus' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  reason: string;
  recommendedAction: string;
  sourceSignals: string[];
  status: 'active' | 'accepted' | 'ignored' | 'completed' | 'expired';
  createdAt: Timestamp;
  completedAt?: Timestamp;
  expiresAt?: Timestamp;
  metadata?: Record<string, unknown>;
}
```

## Rules Implemented

Implemented in:

- `functions/src/interventionEngine.ts`

Rules:

1. Task carry loop
   - If a task has `carryCount >= 2`, Atlas creates an intervention to break it into a micro-task and start a focus session.

2. Overload risk
   - If today's pending/in-progress tasks are `>= 7`, Atlas suggests survival mode and choosing the top 3.

3. Low energy risk
   - If today's reflection has `energyLevel <= 2`, Atlas suggests a lighter plan and recovery routine.

4. Reflection avoidance
   - If no reflection exists today, Atlas suggests a 2-minute honesty check.

5. Budget discipline risk
   - If latest budget `spent > totalBudget`, Atlas suggests a spending freeze and budget review.

6. Digital distraction risk
   - If today's digital usage exceeds goal, Atlas suggests Focus Mode.

7. Security risk
   - If unresolved high/critical security events exist, Atlas suggests a security checklist.

## Trigger Behavior

Added Cloud Function triggers:

- `onInterventionTaskWrite`
- `onInterventionDailyLogWrite`
- `onInterventionBudgetWrite`
- `onInterventionDigitalWrite`
- `onInterventionSecurityWrite`

These evaluate the deterministic rule engine for the affected user.

## Anti-Duplicate Logic

Interventions use stable document IDs:

- `task_carry_loop_{taskId}`
- `overload_{YYYY-MM-DD}`
- `low_energy_{YYYY-MM-DD}`
- `reflection_avoidance_{YYYY-MM-DD}`
- `budget_overrun_{month}`
- `digital_distraction_{YYYY-MM-DD}`
- `security_risk_{type}`

If an active intervention already exists, the engine does not recreate it. If a non-active intervention has not expired, it is also not recreated.

## AI Integration

AI is optional and server-side only.

Flow:

1. Deterministic rule detects risk.
2. Rule creates a draft intervention.
3. The engine calls the existing server-side Intervention Agent to improve wording.
4. If AI fails or is offline, the deterministic wording is used.

No mobile AI provider calls were added.

## Mobile UI Changes

Added:

- `apps/mobile/src/components/cards/InterventionCard.tsx`
- `apps/mobile/app/(main)/interventions.tsx`
- `apps/mobile/src/services/data/interventions.ts`

Updated:

- Command Dashboard shows active intervention cards.
- Cortex screen shows active intervention cards.
- Dedicated Interventions screen lists all active cards.
- Intervention cards support:
  - Accept
  - Ignore
  - Complete

Accept behavior:

- Creates a task from the intervention recommendation.
- Marks the intervention as accepted.

## Firestore Rules

Updated:

- `firestore.rules`

Rules:

- Owners can read interventions.
- Owners can create valid interventions.
- Owners can update only status/completion metadata.
- Deletes are denied.

Note:

- Cloud Functions use Admin SDK and are not restricted by client rules.

## Files Changed

Functions:

- `functions/src/interventionEngine.ts`
- `functions/src/index.ts`

Mobile:

- `apps/mobile/src/types/firestore.ts`
- `apps/mobile/src/services/data/interventions.ts`
- `apps/mobile/src/services/data/index.ts`
- `apps/mobile/src/components/cards/InterventionCard.tsx`
- `apps/mobile/src/components/cards/index.ts`
- `apps/mobile/src/components/ui/index.ts`
- `apps/mobile/src/constants/routes.ts`
- `apps/mobile/app/(main)/_layout.tsx`
- `apps/mobile/app/(main)/index.tsx`
- `apps/mobile/app/(main)/cortex.tsx`
- `apps/mobile/app/(main)/interventions.tsx`

Rules:

- `firestore.rules`

Documentation:

- `docs/ATLAS_PHASE_8_INTERVENTION_ENGINE.md`

## Remaining Work

High priority:

- Add tests for duplicate prevention.
- Add scheduled expiration cleanup.
- Add richer accept actions, such as directly starting Focus Mode for focus interventions.
- Add goal, health, and finance-specific task templates.
- Add push/local notification delivery after intervention creation.

Medium priority:

- Add intervention history filters.
- Add Firestore indexes if Firebase requests them for `status + createdAt` queries.
- Add server-side callable to accept interventions for stricter action auditing.
- Add intervention analytics to Cortex weekly reports.

Low priority:

- Add visual grouping by severity.
- Add intervention snooze.
- Add user settings for intervention sensitivity.

## Commands Run And Results

Passed:

```powershell
npm run build --workspace=functions
```

Result:

- Initially failed due to strict TypeScript inference for task signal fields in `functions/src/interventionEngine.ts`.
- Fixed by adding an explicit `TaskSignal` type.
- Passed after the fix.

Passed:

```powershell
npm run typecheck --workspace=apps/mobile
```

Result:

- Passed. Mobile TypeScript check completed successfully.

Passed:

```powershell
npm run typecheck --workspaces --if-present
```

Result:

- Passed. Mobile and legacy API TypeScript checks completed successfully.
