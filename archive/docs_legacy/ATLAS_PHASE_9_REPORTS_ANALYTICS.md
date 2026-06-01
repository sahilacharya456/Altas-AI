# Atlas AI Phase 9: Reports and Analytics

## Goal

Build first-class daily and weekly intelligence reports so Atlas AI can turn execution signals into serious command artifacts, not just dashboard cards.

## Report Schema

Firestore path:

```text
users/{userId}/reports/{reportId}
```

Report types:

- `daily`
- `weekly`
- `monthly`

Mobile type added:

- `AtlasReport`
- `ReportMetrics`
- `ReportChartPoint`
- `ReportType`

Core report fields:

- `title`, `summary`, `type`
- `periodStart`, `periodEnd`, `generatedAt`
- `metrics`: discipline score, execution rate, completed tasks, missed tasks, carried tasks, focus minutes, goal progress, reflection consistency, mood average, energy average
- `charts`: execution rate, discipline score, focus minutes, carried tasks, mood/energy
- `priorities`, `riskReasons`, `recommendedFocusWindow`, `strictMentorMessage`
- `warnings`, `biggestWeakness`, `biggestWin`, `nextPlan`
- `sections`
- `aiGenerated`, `provider`, `offline`
- `exportStatus`

## Backend Implementation

Added `functions/src/reportsEngine.ts`.

The report engine builds deterministic reports from:

- `users/{userId}/tasks`
- `users/{userId}/goals`
- `users/{userId}/dailyLogs`
- `users/{userId}/focusSessions`
- `users/{userId}/analytics`
- `users/{userId}/cortex/riskState`
- `users/{userId}/digitalUsage`
- `users/{userId}/budgets`
- `users/{userId}/securityEvents`
- `users/{userId}/healthLogs`
- `users/{userId}/profile/data`

Callable functions updated/added:

- `generateDailyBriefing` now also stores a daily report.
- `generateWeeklyReport` now also stores a weekly report.
- `generateDailyReport` creates a deterministic daily report without requiring an AI provider.
- `generateMonthlyReportPlaceholder` creates the monthly placeholder structure.

The older `aiReports` path remains for compatibility, but the product-facing report system now uses `users/{userId}/reports`.

## AI and Deterministic Logic

The system uses the Phase 7 Report Agent when `generateWeeklyReport` is called and merges the agent output into the stored weekly report.

If the AI provider is unavailable or offline, reports still work through deterministic logic. The deterministic layer calculates:

- execution rate from completed, missed, and carried tasks
- focus minutes from focus sessions
- goal progress from active/non-abandoned goals
- reflection consistency from daily logs
- mood and energy averages from reflections
- risk reasons from Cortex risk state plus task/reflection/energy signals
- warnings from finance, health, digital usage, and security data

No mobile client-side AI provider calls were added.

## Mobile Screens Added

Added:

- `apps/mobile/app/(main)/reports.tsx`
- `apps/mobile/app/(main)/daily-report.tsx`
- `apps/mobile/app/(main)/weekly-report.tsx`

Reports list:

- Shows stored report history.
- Can generate daily, weekly, and monthly placeholder reports.
- Marks reports as deterministic (`DET`) or AI-assisted (`AI`).

Daily briefing detail:

- Shows execution risk proxy through execution rate.
- Shows top priorities.
- Shows risk reasons.
- Shows recommended focus window.
- Shows strict mentor message.
- Shows warnings from secondary modules when available.

Weekly report detail:

- Shows discipline score.
- Shows execution rate.
- Shows completed, missed, and carried task metrics.
- Shows focus minutes.
- Shows goal progress, reflection consistency, mood/energy patterns.
- Shows biggest weakness, biggest win, and next week plan.

Monthly report:

- Structure exists through a callable placeholder.
- Full month-over-month intelligence and PDF export remain future work.

## Charts

Added lightweight chart component:

- `apps/mobile/src/components/charts/MetricBarChart.tsx`

No heavy chart dependency was added. The component uses React Native views and supports:

- execution rate
- discipline score trend
- focus minutes
- carried task count
- mood/energy paired bars

## Routing and Access

Updated:

- `apps/mobile/src/constants/routes.ts`
- `apps/mobile/app/(main)/_layout.tsx`
- `apps/mobile/app/(main)/index.tsx`

The Command Dashboard now links to Reports as a secondary module.

Firestore rules updated:

- `users/{userId}/reports/{reportId}` is owner-readable.
- Client writes are denied.
- Reports are written by authenticated Cloud Functions.

## Files Changed

- `apps/mobile/app/(main)/daily-report.tsx`
- `apps/mobile/app/(main)/index.tsx`
- `apps/mobile/app/(main)/reports.tsx`
- `apps/mobile/app/(main)/weekly-report.tsx`
- `apps/mobile/app/(main)/_layout.tsx`
- `apps/mobile/src/components/charts/MetricBarChart.tsx`
- `apps/mobile/src/components/charts/index.ts`
- `apps/mobile/src/constants/routes.ts`
- `apps/mobile/src/features/reports/ReportDetailView.tsx`
- `apps/mobile/src/services/ai/index.ts`
- `apps/mobile/src/services/ai/reports.ts`
- `apps/mobile/src/services/data/index.ts`
- `apps/mobile/src/services/data/reports.ts`
- `apps/mobile/src/types/firestore.ts`
- `functions/src/aiCallables.ts`
- `functions/src/index.ts`
- `functions/src/reportsEngine.ts`
- `firestore.rules`
- `docs/ATLAS_PHASE_9_REPORTS_ANALYTICS.md`

## Remaining Work

- Add PDF export and share flow.
- Add scheduled server-side generation for daily/weekly reports.
- Add Firestore composite indexes only if future report queries require multi-field filters.
- Add richer finance, digital, health, and security summaries once those modules have stronger normalized aggregates.
- Add report retention and archival policy.
- Add notification hooks for weekly report availability.
- Add route-level polish for monthly report detail if monthly reporting becomes active.

## Commands Run

```text
npm run build --workspace=functions
```

Result: failed once because `RiskLevel` was declared but unused in `functions/src/reportsEngine.ts`.

Fix: removed the unused type.

```text
npm run build --workspace=functions
```

Result: passed.

```text
npm run typecheck --workspace=apps/mobile
```

Result: failed once because `MetricBarChart` used percentage height strings without an explicit React Native `DimensionValue` type.

Fix: typed chart bar heights as `DimensionValue`.

```text
npm run typecheck --workspace=apps/mobile
```

Result: passed.

```text
npm run typecheck --workspaces --if-present
```

Result: passed for available workspace typecheck scripts.

## Exact Next Steps for Phase 10

1. Add scheduled Cloud Functions for daily briefing and weekly report generation.
2. Add notification delivery for high-risk daily reports and completed weekly reports.
3. Build PDF/export service behind authenticated Cloud Functions.
4. Add report retention settings in Profile.
5. Improve cross-domain aggregation so finance, digital, health, and security summaries are richer than warning flags.
