# Atlas Cinematic Frontend Correction

Date: 2026-05-28

## What Was Wrong

The previous Welcome screen drifted into a normal dark SaaS layout. It used a large rounded hero card, heavy explanatory copy, a visible operating-loop panel, and dashboard-style surfaces. That made Atlas feel like a polished productivity app, not a cinematic personal discipline operating system.

## Video Reference Analysis

- **Color palette:** black-first base, near-black depth, restrained emerald/teal intelligence light, minimal blue.
- **Motion style:** slow breathing energy, orbital movement, small particles, smooth fades, no fast spinning or bounce.
- **Layout composition:** one dominant central core, large negative space, minimal brand text, controlled CTA placement.
- **Hero treatment:** the brand is implied by the living core and sparse copy instead of explanation cards.
- **Particle behavior:** particles feel like signal energy orbiting a central intelligence source.
- **Adapted for Atlas:** Atlas Core is now the visual anchor for the OS, with emerald particles and thin rings.
- **Avoided:** large blue cards, neon cyberpunk glow, rotated noisy labels, paragraph-heavy onboarding copy, and generic AI-dashboard panels.

## New Design Direction

Atlas now starts from a cinematic black UI direction:

- Backgrounds use `#020403`, `#050807`, and `#070B0A`.
- Emerald/mint is the main intelligence accent.
- Surfaces are dark, subtle, and mostly transparent.
- Welcome avoids explaining the product; it creates premium impact first.
- Dashboard and Cortex inherit the black-first theme through shared tokens and card styling.

## Color System

- Base: near-black / ink graphite.
- Accent: emerald, mint, deep teal.
- Text: near-white primary, muted cool gray secondary.
- Borders: low-opacity emerald/white lines.
- Blue is no longer the dominant dashboard surface language.

## Typography System

No new font dependency was added. The pass uses the existing Atlas typography tokens with stricter hierarchy:

- Small wordmark and system label.
- Compact premium title.
- Short supporting copy.
- Button text with strong weight and clear contrast.

## AtlasCoreVisual Implementation

Updated `apps/mobile/src/components/ui/AtlasCoreVisual.tsx`:

- Rebuilt the core with `react-native-svg` plus Reanimated wrappers.
- Added radial glow, thin rings, orbital particles, and a soft central light.
- Removed default signal-label clutter.
- Made the core transparent so it can sit directly on black instead of inside a blue card.
- Preserved `CortexCoreVisual` export and existing props for dashboard/cortex compatibility.

## Screens Corrected

- **Welcome:** rebuilt as a full-screen cinematic black intro.
- **Global tokens:** shifted to black-first cinematic colors.
- **Shared cards:** command card gradient moved away from blue-card styling.
- **Dashboard/Cortex:** partially corrected through the shared Atlas Core and theme token updates.

## Remaining Weak Screens

- Login/Register still need a dedicated cinematic pass after the identity correction.
- Dashboard and Cortex should be further tuned so they feel like a command OS rather than a card feed.
- Support modules still need screen-by-screen cinematic cleanup.

## Commands Run

- `npm run typecheck --workspace=apps/mobile`
  - Passed.
- `npm run typecheck --workspaces --if-present`
  - Passed for mobile and legacy API workspaces.
- `npm test --workspaces --if-present`
  - Passed. Functions: 5 suites / 12 tests. Mobile/API: no tests found with `--passWithNoTests`.

Browser verification:

- Opened `http://localhost:8081/(auth)/welcome`, which normalized to `/welcome`.
- DOM verified corrected Welcome copy and buttons:
  - `ATLAS AI`
  - `Core online`
  - `Personal Discipline OS`
  - `Discipline, measured.`
  - `Command your day before it controls you.`
  - `Begin Command`
  - `I already have access`

## Known Limitations

- Browser screenshot capture timed out in the in-app browser layer, so visual verification used live DOM inspection instead of a captured image.
- The rest of the app is not fully cinematic yet; this pass intentionally corrected the identity root before deeper screen rewrites.
