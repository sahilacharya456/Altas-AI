# AltasAI Product Metrics

## North Star Metric

**Weekly completed execution loops per active user.**

Target for beta validation: ≥ 2 loops/week for ≥ 60% of retained users.

A completed loop:
```
task_created + focus_started + focus_completed + reflection_submitted
(all within the same calendar day, for the same user)
```

---

## Funnel Metrics (Track During Beta)

| Metric | Definition | Target |
|---|---|---|
| Onboarding completion | % who complete onboarding after registration | > 80% |
| First task creation | % who create ≥1 task within 24h of onboarding | > 70% |
| First focus session | % who start a focus session within 48h | > 50% |
| First reflection | % who submit a reflection within 72h | > 40% |
| First mentor prompt | % who send ≥1 mentor message within 7 days | > 60% |
| Day 1 retention | % who open app again next day | > 50% |
| Day 7 retention | % who open app on day 7 or later | > 30% |
| Weekly loop rate | Avg completed loops/week per active user | > 2 |

---

## Engagement Metrics

| Metric | Definition | Notes |
|---|---|---|
| Mentor prompt rate | Avg prompts/user/week | Signals engagement depth |
| Recommendation acceptance | % of intervention cards acted on | Proxy for mentor quality |
| Gemini fallback rate | % of mentor calls using internal fallback | Track API reliability |
| Reflection streak | Avg consecutive days with reflection | Habit formation signal |
| Carry task rate | % of tasks carried to next day | Execution difficulty signal |

---

## Anti-Metrics (Signs AltasAI Is Not Working)

| Anti-metric | Threshold | Meaning |
|---|---|---|
| Onboarding drop-off > 50% | Immediate | Onboarding is confusing |
| < 20% first focus session | Week 1 | Tasks exist but action doesn't follow |
| < 20% first reflection | Week 2 | Reflection friction is too high |
| Mentor fallback > 60% | Persistent | Backend is unreliable |
| Day 7 retention < 20% | After beta | Product doesn't create a habit |
| 0 users with 2+ weekly loops | After 30 days | Core loop is not compelling |

---

## Monetization Readiness Signal

AltasAI is ready to introduce a paid tier when:
1. ≥ 20 users consistently complete 2+ loops/week
2. Day 30 retention ≥ 25%
3. At least 5 users explicitly ask for "more" (more mentor sessions, more detail in reports)

At that point, the paid tier features are:
- Unlimited daily mentor sessions (above quota)
- Full Cortex weekly report
- Advanced execution history
- Priority ML personalization (when ML service is production-ready)

---

## Metrics Collection Reality Check

**Current state**: Events buffered locally in `productEvents.ts`, never persisted.

**Phase 1 (now)**: Manual spreadsheet for 10 beta users.

**Phase 2** (after first cohort): Firestore event collection from backend.

**Phase 3** (after 50 users): PostHog or Mixpanel with full funnel visualization.

Do not build Phase 3 infrastructure before Phase 1 data shows the product works.
