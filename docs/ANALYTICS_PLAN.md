# AltasAI Analytics Plan

## Honest Current State

The `productEvents.ts` system exists and fires events correctly. **Events are buffered in local memory only.** They are never sent to any analytics backend, database, or dashboard. This is intentional for now — analytics backend adds complexity before the product is proven.

---

## North Star Metric

**Weekly completed execution loops per active user.**

A completed loop is:
```
task_created → focus_started → focus_completed → reflection_submitted
```

If a user completes 2+ loops per week for 4 consecutive weeks, AltasAI is changing behavior. That is the only metric that matters for the first 30 days of beta.

---

## Core Funnel (Ordered)

| Step | Event | Fires Where |
|---|---|---|
| 1 | `onboarding_completed` | `useAuthStore.completeOnboarding` |
| 2 | `task_created` | `tasksStore.createTask` |
| 3 | `focus_started` | `focus.tsx` when session begins |
| 4 | `focus_completed` | `focus.tsx` when session ends successfully |
| 5 | `reflection_submitted` | `useReflection.handleComplete` |
| 6 | `mentor_prompt_submitted` | `useMentor.handleSend` |
| 7 | `mentor_response_received` | `useMentor.handleSend` on success |
| 8 | `recommendation_accepted` | `InterventionCard.onAccept` |
| 9 | `report_generated` | Reports screen on successful load |

Missing events that need to be added (P2):
- `weekly_report_viewed` — fires when weekly report screen loads with content
- `next_action_accepted` — fires when a specific mentor action is tapped

---

## Beta Analytics Approach (Firestore-based, No Third Party)

The lowest-cost analytics backend is Firestore itself. Write events server-side after each AI call — the backend already receives userId and context.

### Implement in Phase 2 (after first 10 beta users)

Add a `userAnalytics/{userId}/events` subcollection from the backend:

```typescript
// In backend/api/src/routes/ai.routes.ts, after each successful /api/mentor call:
await db.collection(`users/${userId}/analytics`).add({
  event: 'mentor_response_received',
  provider: result.provider,
  offline: result.offline,
  createdAt: FieldValue.serverTimestamp(),
});
```

This gives you a queryable event log per user without any third-party cost.

### Weekly Loop Counter (Implement in Phase 2)

After each `reflection_submitted` event, check if the user also had `focus_started` and `task_created` in the same day. If yes, increment `users/{uid}/analytics/weeklyLoops.count`.

---

## Beta Manual Tracking (Phase 1 — Now)

For the first 10 beta users, track manually in a spreadsheet:

```
Columns:
User ID | Signup Date | Onboarded? | First Task | First Focus | First Reflection | Mentor Prompts | Day 7 Active? | Weekly Loops
```

Update this after each user's first week. 2+ weekly loops = product-market signal.

---

## Third-Party Analytics (Phase 3 — Optional)

Consider only after 50+ active users:

- **PostHog** (open source, self-hostable) — send events via REST API
- **Mixpanel** (free tier: 20M events/month) — mobile SDK available
- **Firebase Analytics** — requires native build (not Expo Go compatible)

For Expo Web builds, Firebase Analytics works via the web SDK:
```typescript
import { getAnalytics, logEvent } from 'firebase/analytics';
const analytics = getAnalytics(app);
logEvent(analytics, 'task_created', { userId: user.uid });
```

This is already available in `apps/mobile/src/services/firebase/config.ts` — add it when ready.

---

## What NOT to Do Yet

- Do not instrument every tap and scroll — noisy data before product-market fit
- Do not set up a Mixpanel/Amplitude account before 50 users — premature
- Do not claim analytics are "working" until events are persisted somewhere
- Do not build a custom analytics dashboard — use Firestore Console queries for beta
