# AltasAI Feature Flags

Feature flags are defined in `apps/mobile/src/config/featureFlags.ts`.

## Purpose

Guards unfinished or secondary features from appearing in the MVP demo flow. Setting a flag to `true` must mean:
1. The feature has a working backend route (or works fully client-side).
2. The screen has loading, empty, and error states.
3. No placeholder copy appears in the visible UI.
4. The feature has been manually tested on at least one device.

## Flag Reference

| Flag | Default | Status | Notes |
|---|---|---|---|
| `TASKS` | `true` | MVP | Core execution signal |
| `FOCUS` | `true` | MVP | Core execution signal |
| `REFLECTION` | `true` | MVP | Core execution signal |
| `MENTOR` | `true` | MVP | Core AI feature |
| `CORTEX` | `true` | MVP | Internal intelligence |
| `INTERVENTIONS` | `true` | MVP | Risk cards |
| `GOALS` | `true` | MVP | Long-horizon tracking |
| `REPORTS` | `true` | MVP | Weekly output |
| `PROFILE` | `true` | MVP | Settings |
| `ANALYTICS` | `true` | MVP | Basic execution metrics |
| `HEALTH` | `isDev` | Dev-only | Real feature, not MVP |
| `DIGITAL_DISCIPLINE` | `isDev` | Dev-only | Real feature, not MVP |
| `BEHAVIOR_TIMELINE` | `isDev` | Dev-only | Real feature, not MVP |
| `FINANCE_KHATA` | `false` | Postponed | Requires product decision |
| `NEWS_LAB` | `false` | Postponed | Not connected to execution loop |
| `SECURITY_SCAN_LINK` | `false` | Postponed | Secondary feature |
| `DEVICE_SAFETY` | `false` | Postponed | Secondary feature |

## How to Gate a Screen

If a flag is `false`, the route shows `ComingSoonScreen` instead of the real feature. This keeps the code intact without showing broken or placeholder UIs.

## Enabling for Beta

When a feature is ready for beta users:
1. Verify it meets the three criteria above.
2. Set the flag to `true` in `featureFlags.ts`.
3. Run `npm run typecheck --workspaces --if-present` and `npm test --workspaces --if-present`.
4. Verify the ComingSoonScreen no longer appears for that route.

## Tests

`src/__tests__/featureFlags.test.ts` verifies that:
- All core MVP flags are `true`.
- All postponed flags are `false`.
- The `isEnabled` helper returns correct values.
