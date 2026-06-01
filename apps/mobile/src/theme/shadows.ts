/**
 * AltasAI - Shadow and elevation tokens
 * Tuned for dark surfaces. Keep shadows subtle and use glow sparingly.
 */

export const ALTASAI_SHADOWS = {
    none: {
        shadowOpacity: 0,
        elevation: 0,
    },
    card: {
        shadowColor: '#020617',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.28,
        shadowRadius: 24,
        elevation: 6,
    },
    command: {
        shadowColor: '#020617',
        shadowOffset: { width: 0, height: 22 },
        shadowOpacity: 0.34,
        shadowRadius: 34,
        elevation: 10,
    },
    accent: {
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 7,
    },
} as const;

export const shadows = ALTASAI_SHADOWS;
