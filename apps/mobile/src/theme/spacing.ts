/**
 * AltasAI - Spacing System
 * 8px base unit for consistent layout
 */

export const ALTASAI_SPACING = {
    0: 0,
    1: 4,    // 0.5 unit
    2: 8,    // 1 unit
    3: 12,   // 1.5 units
    4: 16,   // 2 units
    5: 20,   // 2.5 units
    6: 24,   // 3 units
    8: 32,   // 4 units
    10: 40,  // 5 units
    12: 48,  // 6 units
    16: 64,  // 8 units
    20: 80,  // 10 units
    24: 96,  // 12 units

    // Semantic Aliases
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
} as const;

// Export
export const spacing = ALTASAI_SPACING;
