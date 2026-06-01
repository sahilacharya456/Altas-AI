# Atlas AI Video-Inspired Frontend Polish

Date: 2026-05-28

## Video Design Analysis

The reference video shows a dark product experience with a central intelligence visualization rather than a conventional page layout. It should be treated as mood and motion inspiration only.

### 1. Color Palette

- Primary foundation: near-black graphite and ink navy.
- Main intelligence accent: refined emerald/teal green.
- Supporting tones: muted white labels, cool gray text, very dark surface depth.
- Glow behavior: green appears around the core and selected signal areas only, not across every card.

### 2. Motion Style

- Cinematic zoom and camera movement around a signal field.
- Slow orbiting particle motion around a central core.
- Controlled pulse from the center.
- Motion feels like intelligence becoming legible, not decoration.

### 3. Layout Composition

- Strong central visual anchor.
- Minimal copy and sparse labels around the visualization.
- Large negative space with high contrast.
- Interface hierarchy is driven by the core visual first, then labels and actions.

### 4. Hero / Brand Treatment

- The brand appears as a serious AI system with a memorable central identity.
- Text is minimal and direct.
- The hero is not a marketing card grid; it is a focused command surface.

### 5. Particle / Core Visual Behavior

- Central glowing core.
- Orbit rings and particle points imply signals flowing into intelligence.
- Small labels identify signal domains without crowding the view.
- Brightness is concentrated near the core and fades into the field.

### 6. Adapted For Atlas AI

- Atlas now has an `AtlasCoreVisual` and `CortexCoreVisual` component for the command-center identity.
- The global accent system moved toward emerald/teal intelligence tones.
- Welcome, Command Dashboard, and Cortex now use the central core visual language.
- The visual metaphor maps directly to Atlas: signals feeding Cortex and becoming execution decisions.

### 7. Rejected / Avoided Patterns

- The Instagram/Reels overlay from the reference was not adapted.
- The heavy particle volume was reduced for mobile performance and readability.
- Aggressive neon, gaming HUD styling, and overdone glassmorphism were avoided.
- No fake AI output or client-side model calls were added.

## Adopted Design Principles

- Dark graphite / ink navy foundation.
- Emerald/teal intelligence accent used as a command signal, not decoration.
- Central brand identity through Atlas Core / Cortex Core.
- Sparse labels, controlled contrast, and strong visual hierarchy.
- Smooth pulse/orbit motion with a graceful static fallback.
- Real app usability remains higher priority than cinematic spectacle.

## Color System

Updated `ATLAS_COLORS` with:

- `accent.primary`, `accent.bright`, and `primary.DEFAULT` shifted to refined emerald/teal.
- `intelligence` token group for core, ring, particle, muted, field, and glow colors.
- `opacity` token group for disabled, pressed, muted, subtle, and overlay states.

Updated `ATLAS_GRADIENTS` with:

- calmer app background graphite/ink gradient.
- `core` radial-style wash colors for intelligence visuals.
- `intelligence` and teal-first `primary` gradients.
- command gradient toned toward teal/cyan instead of blue-violet dominance.

## Typography System

No new font dependency was added. Existing Atlas typography tokens remain the base system:

- strong weights for brand and dashboard numbers.
- readable body line heights.
- no negative letter spacing.
- compact uppercase labels only for technical signal labels.

## Components Created / Updated

- Created `apps/mobile/src/components/ui/AtlasCoreVisual.tsx`
  - central intelligence core.
  - subtle orbit rings.
  - deterministic signal particles.
  - sparse domain labels.
  - Reanimated pulse/orbit motion.
  - `reducedMotion` support.
- Created `apps/mobile/src/components/ui/SurfaceCard.tsx`
  - calm surface wrapper over the existing card primitive.
- Updated exports:
  - `apps/mobile/src/components/ui/index.ts`
  - `apps/mobile/src/components/cards/index.ts`
- Updated theme tokens:
  - `apps/mobile/src/theme/colors.ts`
  - `apps/mobile/src/theme/gradients.ts`
  - `apps/mobile/src/theme/motion.ts`

## Screens Polished

- `apps/mobile/app/(auth)/welcome.tsx`
  - Replaced static hero image treatment with the Atlas Core visual.
  - Kept copy strict and minimal: discipline, command, measurable execution.
  - Preserved login/register navigation.

- `apps/mobile/app/(main)/index.tsx`
  - Added a top Atlas Core command card.
  - Reinforced the dashboard as a daily command center before secondary modules.
  - Kept existing task/goal/intervention data logic intact.

- `apps/mobile/app/(main)/cortex.tsx`
  - Added Cortex Core visual and clearer behavior-intelligence framing.
  - Kept deterministic risk scoring and existing data loading intact.

## Motion Decisions

- Added `corePulse` and `coreOrbit` motion timings.
- Core motion is slow, smooth, and low-intensity.
- Particle positions are deterministic to avoid random layout jumps.
- No heavy animation libraries were added.
- No aggressive infinite glow or animated background noise was introduced.

## Files Changed

- `apps/mobile/src/theme/colors.ts`
- `apps/mobile/src/theme/gradients.ts`
- `apps/mobile/src/theme/motion.ts`
- `apps/mobile/src/components/ui/AtlasCoreVisual.tsx`
- `apps/mobile/src/components/ui/SurfaceCard.tsx`
- `apps/mobile/src/components/ui/index.ts`
- `apps/mobile/src/components/cards/index.ts`
- `apps/mobile/app/(auth)/welcome.tsx`
- `apps/mobile/app/(main)/index.tsx`
- `apps/mobile/app/(main)/cortex.tsx`
- `docs/ATLAS_VIDEO_INSPIRED_FRONTEND_POLISH.md`

## Commands Run

- `ffmpeg -version`
  - Result: failed because `ffmpeg` is not available on PATH.
- `python -m pip install --user imageio imageio-ffmpeg`
  - Result: succeeded. Used only as local reference-frame extraction tooling; no project dependency was added.
- Python frame extraction script for the attached WhatsApp video
  - Result: succeeded. Extracted frames to `.codex/video_frames/` for visual analysis.
- `npm run typecheck --workspace=apps/mobile`
  - Result: passed.
- `npm run typecheck --workspaces --if-present`
  - Result: passed for mobile and legacy API workspaces.
- `npm test --workspaces --if-present`
  - Result: passed. Mobile/API had no tests found with `--passWithNoTests`; functions test suite passed 4 suites / 10 tests.
- `npm run web --workspace=apps/mobile`
  - Result: Expo Web bundled successfully and waited on `http://localhost:8081`.
- Browser smoke check for `http://localhost:8081`
  - Result: blocked before visual inspection by existing Firebase configuration guard: `Missing EXPO_PUBLIC_FIREBASE_API_KEY or EXPO_PUBLIC_FIREBASE_PROJECT_ID. Check apps/mobile/.env.`
  - No secrets were added to bypass this. The temporary Expo Web process was stopped after the check.

`npm run build --workspace=functions` was not run in this polish pass because no functions code was touched.

## Remaining Weak Screens

- Several older support screens still carry legacy visual language and should be migrated gradually:
  - finance/budget detail flows.
  - health detail flow.
  - digital usage detail flow.
  - security scan subflows.
  - profile/settings/privacy detail states.
- Some legacy UI primitives remain available:
  - `CyberBackground`
  - `GlowingText`
  - `NeuralLoader`
  These should be retired or internally restyled in a later pass if screens still import them.
- Full responsive visual QA with Expo Web screenshots was not completed because local Firebase public env values are not configured.
- No new UI snapshot/smoke tests were added.

## Next Frontend Steps

1. Migrate remaining screens to `SurfaceCard`, `CommandCard`, and Atlas Core-inspired hierarchy where appropriate.
2. Replace legacy neon/cyber primitives with calm Atlas Command OS equivalents.
3. Add screenshot QA for Welcome, Dashboard, Cortex, Tasks, Reports, and Settings on mobile and web widths.
4. Add a reduced-motion setting wired to animation-heavy components.
5. Continue refining copy toward direct, strict, calm Atlas language.
