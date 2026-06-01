/**
 * AltasAI - Gradient tokens
 * Use these for premium depth without drifting into excessive neon.
 */

export const ALTASAI_GRADIENTS = {
    appBackground: ['#020403', '#040706', '#070B0A'] as const,
    surface: ['rgba(255, 255, 255, 0.048)', 'rgba(255, 255, 255, 0.018)'] as const,
    command: ['rgba(53, 232, 180, 0.075)', 'rgba(255, 255, 255, 0.020)'] as const,
    core: ['rgba(166, 255, 231, 0.24)', 'rgba(53, 232, 180, 0.10)', 'rgba(2, 4, 3, 0.00)'] as const,
    intelligence: ['#A6FFE7', '#35E8B4', '#0D7A5D'] as const,
    primary: ['#A6FFE7', '#35E8B4', '#0D7A5D'] as const,
    secondary: ['rgba(255, 255, 255, 0.060)', 'rgba(255, 255, 255, 0.020)'] as const,
    danger: ['rgba(248, 113, 113, 0.92)', 'rgba(225, 29, 72, 0.92)'] as const,
    success: ['rgba(52, 211, 153, 0.92)', 'rgba(16, 185, 129, 0.92)'] as const,
    warning: ['rgba(251, 191, 36, 0.92)', 'rgba(245, 158, 11, 0.92)'] as const,
} as const;

export const gradients = ALTASAI_GRADIENTS;
