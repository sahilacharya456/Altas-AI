/**
 * AltasAI - Global Color System
 * AltasAI Command OS now uses a black-first cinematic base.
 * Emerald intelligence accents guide attention without turning the UI neon.
 */

export const ALTASAI_COLORS = {
    background: {
        primary: '#020403',
        secondary: '#050807',
        tertiary: '#070B0A',
        elevated: '#0B1110',
        overlay: 'rgba(2, 4, 3, 0.82)',
    },

    surface: {
        base: '#050807',
        raised: '#0A100F',
        command: '#0D1513',
        subtle: 'rgba(255, 255, 255, 0.035)',
        strong: 'rgba(255, 255, 255, 0.065)',
    },

    accent: {
        primary: '#35E8B4',
        bright: '#A6FFE7',
        dim: '#0D7A5D',
        violet: '#7A74D8',
        cyan: '#25B9A5',
        blue: '#355DFF',
        glow: 'rgba(53, 232, 180, 0.16)',
        DEFAULT: '#35E8B4',
        dark: '#0D7A5D',
    },

    intelligence: {
        core: '#A6FFE7',
        primary: '#35E8B4',
        secondary: '#22BFA5',
        muted: '#0A5F4F',
        field: 'rgba(53, 232, 180, 0.09)',
        glow: 'rgba(53, 232, 180, 0.20)',
        ring: 'rgba(166, 255, 231, 0.30)',
        particle: 'rgba(236, 255, 248, 0.90)',
    },

    glass: {
        DEFAULT: 'rgba(255, 255, 255, 0.045)',
        border: 'rgba(166, 255, 231, 0.12)',
        highlight: 'rgba(255, 255, 255, 0.05)',
        shadow: 'rgba(0, 0, 0, 0.58)',
    },

    discipline: {
        primary: '#D14A61',
        bright: '#F08393',
        dim: '#8D2638',
        calm: '#6F7EE8',
    },

    success: {
        primary: '#2DBE85',
        dim: '#0E6B4B',
        DEFAULT: '#2DBE85',
        light: '#63D9A7',
        glow: 'rgba(45, 190, 133, 0.14)',
    },

    warning: {
        primary: '#D79A2B',
        dim: '#78350F',
        DEFAULT: '#D79A2B',
        light: '#F0BE63',
        glow: 'rgba(215, 154, 43, 0.14)',
    },

    error: {
        primary: '#E25B5B',
        dim: '#7F1D1D',
        DEFAULT: '#E25B5B',
        light: '#F28A8A',
        glow: 'rgba(226, 91, 91, 0.14)',
    },

    info: {
        primary: '#45A7D8',
        dim: '#075985',
        DEFAULT: '#45A7D8',
        light: '#89C9EA',
    },

    text: {
        primary: '#F4F7F5',
        secondary: '#C9D3CE',
        tertiary: '#8B9B94',
        muted: '#60706A',
        disabled: '#475569',
        inverse: '#020617',
    },

    border: {
        primary: 'rgba(166, 255, 231, 0.12)',
        secondary: 'rgba(255, 255, 255, 0.07)',
        accent: 'rgba(53, 232, 180, 0.28)',
        danger: 'rgba(242, 138, 138, 0.28)',
    },

    primary: {
        DEFAULT: '#35E8B4',
        light: '#A6FFE7',
        dark: '#0D7A5D',
        glow: 'rgba(53, 232, 180, 0.16)',
    },

    opacity: {
        disabled: 0.52,
        pressed: 0.92,
        muted: 0.68,
        subtle: 0.42,
        overlay: 0.78,
    },
} as const;


