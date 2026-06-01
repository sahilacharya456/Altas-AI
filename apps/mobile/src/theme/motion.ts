/**
 * AltasAI - Motion System
 * Premium animations with strict performance standards
 */

export const ALTASAI_MOTION = {
    // Duration (ms) - Keep animations fast and purposeful
    duration: {
        instant: 100,
        fast: 150,
        normal: 250,
        slow: 350,
        standard: 220,
        emphasis: 420,
        corePulse: 2600,
        coreOrbit: 18000,
    },
    // Compatibility Alias
    spring: {
        damping: 15,
        stiffness: 300,
        gentle: { damping: 20, stiffness: 200 },
        snappy: { damping: 20, stiffness: 300, mass: 0.5 },
    },

    // Easing Functions
    easing: {
        smooth: [0.4, 0.0, 0.2, 1] as const,      // Ease-in-out
        enter: [0.0, 0.0, 0.2, 1] as const,       // Ease-out (entering)
        exit: [0.4, 0.0, 1, 1] as const,          // Ease-in (exiting)
        spring: {
            damping: 15,
            stiffness: 300,
            gentle: { damping: 20, stiffness: 200 },
        },
    },

    // Preset Animations
    presets: {
        // Page Transition
        pageTransition: {
            type: 'slide',
            direction: 'horizontal',
            duration: 350,
            easing: 'smooth',
        },

        // Card Entrance
        cardEntrance: {
            type: 'fadeInUp',
            distance: 20,
            duration: 400,
            stagger: 80,
        },

        // Button Press
        buttonPress: {
            scale: 0.97,
            duration: 150,
            easing: 'enter',
        },
        scalePress: {
            pressed: 0.97,
            released: 1,
            duration: 120,
        },

        // Success Feedback
        successFeedback: {
            scale: [1, 1.1, 1] as const,
            opacity: [1, 0.8, 1] as const,
            duration: 400,
        },

        // Number Morph
        numberMorph: {
            type: 'count-up',
            duration: 800,
            easing: 'ease-out',
        },

        corePulse: {
            scale: [1, 1.035] as const,
            duration: 2600,
            opacity: [0.82, 1] as const,
        },
    },
} as const;



// Export unified motion
export const motion = ALTASAI_MOTION;
