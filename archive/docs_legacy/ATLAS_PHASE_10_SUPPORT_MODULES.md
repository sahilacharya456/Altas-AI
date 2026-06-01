# Atlas AI Phase 10: Support Modules Upgrade

## Goal

Upgrade finance, health, digital usage, security, and news so they support the Atlas core loop:

```text
Signals -> Cortex -> Insight -> Intervention -> Execution -> Report
```

The key product shift in this phase is that support modules are no longer isolated mini apps. They now emit behavior signals Cortex can use for risk scoring, interventions, reports, and future AI reasoning.

## Finance Upgrades

Updated finance/khata support in:

- `apps/mobile/app/(main)/khata.tsx`
- `apps/mobile/src/services/data/budget.ts`
- `apps/mobile/src/services/data/khata.ts`

Finance now surfaces:

- Finance discipline score
- Budget status
- Spending pace risk
- Overspending warning
- Spending categories
- Khata reminders
- Key finance insight
- Cortex signal explanation
- Shortcut to AI budget insight screen

Behavior events emitted:

- `finance/budget_over_limit`
- `finance/budget_pace_risk`
- `finance/debt_created`
- `finance/repayment_reminder_created`
- `finance/khata_repaid`

These events give Cortex finance discipline signals without requiring the finance UI to become the center of the product.

## Health Upgrades

Updated health support in:

- `apps/mobile/app/(main)/health.tsx`
- `apps/mobile/src/services/data/health.ts`
- `apps/mobile/src/types/firestore.ts`

Health now tracks or computes:

- Sleep
- Water
- Workout minutes/type
- Energy
- Mood/body check
- Stress
- Routine score
- Workout streak
- Average sleep
- Latest routine insight
- Cortex signal explanation

No medical claims were added. The module stays positioned as a routine and energy tracker.

Behavior events emitted:

- `health/low_energy_logged`
- `health/workout_completed`
- `health/routine_consistent`

## Digital Usage Upgrades

Updated digital usage support in:

- `apps/mobile/app/(main)/digital.tsx`
- `apps/mobile/src/services/data/digitalUsage.ts`
- `apps/mobile/src/types/firestore.ts`

Digital now surfaces:

- Screen usage entry
- Daily goal
- Distraction score
- Under-goal streak
- Weekly average
- History list
- Focus recommendation
- Cortex signal explanation

Behavior events emitted:

- `digital/digital_goal_exceeded`

This makes high usage actionable for Cortex and future interventions instead of being a passive log.

## Security Upgrades

Updated security support in:

- `apps/mobile/app/(main)/security.tsx`
- `apps/mobile/app/(main)/scan-link.tsx`
- `apps/mobile/src/services/security/analysis.ts`

Security now surfaces:

- Cyber discipline score
- Link scan history
- Risky scan count
- Device checklist entry point
- Social engineering warning
- Key action
- Cortex signal explanation

The scan screen now saves scan results, so the security dashboard history is backed by Firestore rather than temporary screen state.

Behavior events emitted:

- `security/risky_link_detected`
- `security/security_scan_completed`

## News Repositioning

Updated:

- `apps/mobile/app/(main)/news.tsx`

News is no longer presented as a core mock news feed. It is now positioned as:

```text
AI Life Impact Briefing
```

Current state:

- Lab/future feature positioning
- Clear product note that future value is connecting world events to goals, finance, health, digital usage, and security
- Mock feed remains only as a placeholder/lab surface

## Files Changed

- `apps/mobile/app/(main)/digital.tsx`
- `apps/mobile/app/(main)/health.tsx`
- `apps/mobile/app/(main)/khata.tsx`
- `apps/mobile/app/(main)/news.tsx`
- `apps/mobile/app/(main)/scan-link.tsx`
- `apps/mobile/app/(main)/security.tsx`
- `apps/mobile/src/services/data/budget.ts`
- `apps/mobile/src/services/data/digitalUsage.ts`
- `apps/mobile/src/services/data/health.ts`
- `apps/mobile/src/services/data/khata.ts`
- `apps/mobile/src/services/security/analysis.ts`
- `apps/mobile/src/types/firestore.ts`
- `docs/ATLAS_PHASE_10_SUPPORT_MODULES.md`

## Commands Run

```text
npm run typecheck --workspace=apps/mobile
```

Result: passed.

```text
npm run typecheck --workspaces --if-present
```

Result: passed for available workspace typecheck scripts.

## Remaining Work

- Add server-side Cloud Function triggers for support-module events so behavior signal generation is not dependent only on mobile clients.
- Add anti-duplicate logic for repeated support-module behavior events.
- Add stronger finance aggregates for weekly/monthly reports.
- Add normalized health routine history charts.
- Add digital app/site category entry UI.
- Add richer security event resolution workflow.
- Replace old support-module visual patterns with full Atlas Command OS components over time.
- Add Firestore indexes if future filtered support-module queries require them.

## Phase 11 Recommendations

1. Move behavior event emission for critical signals to Cloud Functions.
2. Add support-module summaries into Cortex `riskState`.
3. Add intervention rules for finance debt, low routine score, digital overload, and risky scan repetition.
4. Add report sections that explain which support-module signals changed the user’s daily/weekly score.
