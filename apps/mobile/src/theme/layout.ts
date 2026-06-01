/**
 * AltasAI - Layout tokens
 * Stable dimensions prevent command surfaces from shifting as data changes.
 */

export const ALTASAI_LAYOUT = {
    screenPadding: 20,
    screenPaddingCompact: 16,
    contentGap: 16,
    bentoGap: 12,
    headerMinHeight: 64,
    tabBarHeight: 72,
    minTouchTarget: 44,
    cardMinHeight: 96,
    commandCardMinHeight: 128,
    contentMaxWidth: 720,
} as const;

export const layout = ALTASAI_LAYOUT;
