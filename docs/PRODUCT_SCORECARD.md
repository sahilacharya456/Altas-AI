# AltasAI Product Scorecard

Use this scorecard before every release.

| Area | Pass Standard | Current Risk |
|---|---|---|
| First-run clarity | User understands AltasAI in 30 seconds | Medium |
| Core loop | Task -> focus -> reflection -> intervention works | Medium |
| Mentor usefulness | Gives one specific next action, not generic advice | Medium |
| Cortex insight | Uses real user data, not fake dashboard copy | Low |
| Reports | Summaries are actionable and evidence-backed | Medium |
| Retention | User has a reason to return tomorrow | High |
| Trust | Data use and safety boundaries are clear | Medium |
| Performance | Practical screens avoid heavy effects | Medium |
| Monetization | Paid reason is obvious | High |

## Release Gate

Do not call a release strong unless:

- all checks pass
- Firestore rules are verified
- onboarding leads to first task/focus/reflection quickly
- mentor fallback works without external AI
- recommendation acceptance can be tracked
- crash reporting is configured for production

## Product Priorities

1. Make the daily execution loop excellent.
2. Make recommendations measurable.
3. Make reports feel earned from real behavior.
4. Make Mentor strict, specific, and safe.
5. Keep secondary modules calm and subordinate.
