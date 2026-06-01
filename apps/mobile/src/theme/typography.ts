/**
 * AltasAI - Typography System
 * System-first hierarchy inspired by Inter/SF Pro.
 */

export const ALTASAI_TYPOGRAPHY = {
    // Font Families
    fontFamily: {
        primary: 'System',
        heading: 'System',
        mono: 'Menlo',
    },

    // Size Scale (Consistent Hierarchy)
    size: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 32,
        '4xl': 36,
        '5xl': 48,
    },

    // Weight System
    weight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    // Line Heights
    leading: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Letter spacing is intentionally neutral for mobile readability.
    tracking: {
        tighter: 0,
        tight: 0,
        normal: 0,
        wide: 0,
    },
} as const;



// Export unified typography
export const typography = ALTASAI_TYPOGRAPHY;
