# Atlas AI Phase 3 Design System Report

Date: 2026-05-27

## Phase Goal

Create the first production-grade Atlas Command OS design-system foundation for the Expo mobile app without changing business logic. This phase focused on reusable theme tokens, shared UI primitives, light adoption, and validation.

## Design Philosophy

Atlas Command OS should feel like a premium personal command center:

- Dark-first navy and graphite foundation, not childish neon.
- Clean glass surfaces with restrained depth and controlled glow.
- Blue and violet accents reserved for focus, AI insight, and primary actions.
- Stable spacing and touch targets so dense command surfaces remain usable.
- Smooth Reanimated interactions only where they clarify feedback.
- Empty, loading, error, risk, and insight states should feel intentional, not temporary.

## Theme Tokens Added Or Improved

Updated:

- `apps/mobile/src/theme/colors.ts`
  - Reworked the palette toward deep navy/graphite surfaces.
  - Added surface, overlay, violet/cyan accent, stronger text hierarchy, and safer semantic colors.
  - Preserved compatibility keys such as `primary`, `accent.DEFAULT`, `background.primary`, and semantic `DEFAULT` fields.

- `apps/mobile/src/theme/typography.ts`
  - Normalized letter spacing to `0` for mobile readability and to avoid fragile text fitting.

- `apps/mobile/src/theme/motion.ts`
  - Added standard/emphasis durations and scale-press preset tokens.

- `apps/mobile/src/theme/index.ts`
  - Exported and attached new theme domains.

Added:

- `apps/mobile/src/theme/shadows.ts`
- `apps/mobile/src/theme/gradients.ts`
- `apps/mobile/src/theme/layout.ts`

These tokens establish shared shadows, restrained gradients, layout constants, min touch target size, screen padding, bento gap, header sizing, and stable card dimensions.

## Components Created

Layout:

- `apps/mobile/src/components/layout/ScreenContainer.tsx`
- `apps/mobile/src/components/layout/AppHeader.tsx`

Common:

- `apps/mobile/src/components/common/GradientButton.tsx`
- `apps/mobile/src/components/common/SectionHeader.tsx`

Cards:

- `apps/mobile/src/components/cards/StatCard.tsx`
- `apps/mobile/src/components/cards/InsightCard.tsx`
- `apps/mobile/src/components/cards/ActionCard.tsx`
- `apps/mobile/src/components/cards/CommandCard.tsx`

Charts:

- `apps/mobile/src/components/charts/ProgressRing.tsx`

Feedback:

- `apps/mobile/src/components/feedback/EmptyState.tsx`
- `apps/mobile/src/components/feedback/LoadingState.tsx`
- `apps/mobile/src/components/feedback/ErrorState.tsx`
- `apps/mobile/src/components/feedback/RiskBadge.tsx`
- `apps/mobile/src/components/feedback/DisciplineBadge.tsx`

Animation utilities:

- `apps/mobile/src/utils/animations.ts`
  - `atlasFadeIn`
  - `atlasSlideUp`
  - `atlasCardEntrance`
  - `usePressScale`
  - `buttonPressSpring`

## Barrel Exports Updated

Updated these indexes so new components can be adopted without deep imports:

- `apps/mobile/src/components/common/index.ts`
- `apps/mobile/src/components/cards/index.ts`
- `apps/mobile/src/components/charts/index.ts`
- `apps/mobile/src/components/feedback/index.ts`
- `apps/mobile/src/components/layout/index.ts`
- `apps/mobile/src/components/ui/index.ts`

The existing UI exports remain intact for compatibility.

## Screens Partially Migrated

Only low-risk loading states were migrated in this phase:

- `apps/mobile/app/index.tsx`
  - Replaced inline spinner and hardcoded background/accent colors with shared `LoadingState`.

- `apps/mobile/app/(main)/_layout.tsx`
  - Replaced duplicated loading screen with shared `LoadingState`.

No business logic, auth routing behavior, Firestore access, AI services, stores, or backend code were changed.

## Accessibility Notes

Implemented foundations:

- Buttons expose `accessibilityRole`, `accessibilityLabel`, and busy/disabled state.
- Default button heights meet or exceed the 44px minimum touch target.
- Text colors use high-contrast light values on dark surfaces.
- Long values in `StatCard` use `adjustsFontSizeToFit` and `numberOfLines` to reduce overflow risk.
- Motion helpers are short and feedback-oriented.

Remaining accessibility work:

- Replace tab bar letter placeholders with proper icons from a supported icon set.
- Audit every migrated screen with real device font scaling.
- Add reduced-motion handling before applying entrance animation broadly.

## Remaining UI Debt

High priority:

- Many screens still use local repeated `sectionTitle`, loading, empty, stat-card, and action-card styles.
- Existing `GlassCard` still supports `neon` and stronger glow behavior. It remains for compatibility but should be visually constrained during screen migrations.
- Existing `AnimatedButton` has older glow/shimmer styling. New work should prefer `GradientButton`.
- Tab icons are text placeholders (`H`, `T`, `G`, `AI`, `P`), not polished command-center navigation icons.

Medium priority:

- `GradientBackground`, `CyberBackground`, `GlowingText`, `PulseCircle`, and `NeuralLoader` may still push the product toward a student/neon look if overused.
- Screens have inconsistent header composition and should migrate to `AppHeader`.
- Many empty/loading/error states remain custom per screen.

Low priority:

- `AnimatedProgressRing` has its own glow behavior. Future polish should add a lower-intensity mode or theme-driven glow option.

## Risk Review

- Risk: Medium. New components are additive and typed, but they introduce a broader visual API that must be used consistently.
- Risk: Low. Loading-state adoption changed only presentation at routing/loading boundaries.
- Risk: Low. Existing component exports were preserved to avoid breaking screens.

## Files Changed

Theme:

- `apps/mobile/src/theme/colors.ts`
- `apps/mobile/src/theme/typography.ts`
- `apps/mobile/src/theme/motion.ts`
- `apps/mobile/src/theme/index.ts`
- `apps/mobile/src/theme/shadows.ts`
- `apps/mobile/src/theme/gradients.ts`
- `apps/mobile/src/theme/layout.ts`

Components:

- `apps/mobile/src/components/layout/ScreenContainer.tsx`
- `apps/mobile/src/components/layout/AppHeader.tsx`
- `apps/mobile/src/components/common/GradientButton.tsx`
- `apps/mobile/src/components/common/SectionHeader.tsx`
- `apps/mobile/src/components/cards/StatCard.tsx`
- `apps/mobile/src/components/cards/InsightCard.tsx`
- `apps/mobile/src/components/cards/ActionCard.tsx`
- `apps/mobile/src/components/cards/CommandCard.tsx`
- `apps/mobile/src/components/charts/ProgressRing.tsx`
- `apps/mobile/src/components/feedback/EmptyState.tsx`
- `apps/mobile/src/components/feedback/LoadingState.tsx`
- `apps/mobile/src/components/feedback/ErrorState.tsx`
- `apps/mobile/src/components/feedback/RiskBadge.tsx`
- `apps/mobile/src/components/feedback/DisciplineBadge.tsx`
- `apps/mobile/src/components/common/index.ts`
- `apps/mobile/src/components/cards/index.ts`
- `apps/mobile/src/components/charts/index.ts`
- `apps/mobile/src/components/feedback/index.ts`
- `apps/mobile/src/components/layout/index.ts`
- `apps/mobile/src/components/ui/index.ts`

Utilities:

- `apps/mobile/src/utils/animations.ts`

Light migration:

- `apps/mobile/app/index.tsx`
- `apps/mobile/app/(main)/_layout.tsx`

Documentation:

- `docs/ATLAS_PHASE_3_DESIGN_SYSTEM.md`

## Commands Run And Results

Passed:

```powershell
npm run typecheck --workspace=apps/mobile
```

Result:

- Passed. `tsc --noEmit` completed successfully.

Unavailable in this workspace:

```powershell
git status --short
git diff -- apps/mobile/src/theme apps/mobile/src/components apps/mobile/src/utils/animations.ts apps/mobile/app/index.tsx 'apps/mobile/app/(main)/_layout.tsx' --stat
```

Result:

- Failed because `C:\Users\sahil\Desktop\ALTAS_AI` is not currently a Git repository.

Passed:

```powershell
npm run typecheck --workspaces --if-present
```

Result:

- Passed. Mobile and legacy API TypeScript checks completed successfully.

## Phase 4 Recommendation

Phase 4 should migrate screens in controlled slices, not all at once:

1. Navigation polish
   - Replace tab text placeholders with accessible icon buttons.
   - Keep labels readable and touch targets stable.

2. Dashboard redesign
   - Convert home dashboard to `ScreenContainer`, `AppHeader`, `StatCard`, `InsightCard`, `ActionCard`, and `CommandCard`.
   - Make the Signals -> Cortex -> Insight -> Intervention -> Execution -> Report loop visible.

3. Tasks and Goals polish
   - Migrate section headers, empty states, stat cards, and primary actions.
   - Keep existing store and Firestore behavior unchanged.

4. AI Mentor polish
   - Use `InsightCard`, `RiskBadge`, and `DisciplineBadge`.
   - Keep all AI calls server-side through Firebase callable functions.

5. Finance, Health, Digital, and Security polish
   - Migrate one module at a time.
   - Replace custom loading/empty/error states with shared primitives.

6. Visual debt cleanup
   - Retire or limit neon-heavy primitives after all screens have safer replacements.
