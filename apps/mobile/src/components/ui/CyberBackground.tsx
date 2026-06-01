import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSpring,
    Easing,
    interpolate,
    withDelay,
    SharedValue,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Svg, { Defs, LinearGradient, Stop, Rect, Pattern, Path } from 'react-native-svg';

const SvgAny = Svg as any;
const DefsAny = Defs as any;
const LinearGradientAny = LinearGradient as any;
const StopAny = Stop as any;
const RectAny = Rect as any;
const PatternAny = Pattern as any;
const PathAny = Path as any;

import { ALTASAI_COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

// --- Particle Colors (Multi-color palette inspired by screenshot) ---
const PARTICLE_COLORS = [
    '#6366F1', // Indigo
    '#8B5CF6', // Purple
    '#A855F7', // Violet
    '#EC4899', // Pink
    '#EF4444', // Red
    '#F97316', // Orange
    '#FBBF24', // Amber/Yellow
    '#10B981', // Emerald
    '#0EA5E9', // Cyan Blue
    '#38BDF8', // Sky Blue
    '#818CF8', // Light Indigo
    '#C084FC', // Light Purple
];

// Orb colors for ambient glow
const ORB_COLORS = [
    ALTASAI_COLORS.accent.primary,
    ALTASAI_COLORS.accent.dim,
    ALTASAI_COLORS.discipline.primary,
];

// --- Configuration ---
const PARTICLE_COUNT = 20; // Reduced for performance
const TOUCH_RADIUS = 120; // How far touch influence extends
const PARTICLE_MIN_SIZE = 2;
const PARTICLE_MAX_SIZE = 5;

// --- Types ---
interface ParticleConfig {
    id: number;
    initialX: number;
    initialY: number;
    size: number;
    color: string;
    speed: number; // drift speed multiplier
    driftAngle: number; // radians
    opacity: number;
}

// --- Generate particle configs once ---
const generateParticles = (): ParticleConfig[] => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        initialX: Math.random() * width,
        initialY: Math.random() * height,
        size: PARTICLE_MIN_SIZE + Math.random() * (PARTICLE_MAX_SIZE - PARTICLE_MIN_SIZE),
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        speed: 0.3 + Math.random() * 0.7,
        driftAngle: Math.random() * Math.PI * 2,
        opacity: 0.4 + Math.random() * 0.6,
    }));
};

// --- Grid Background (existing) ---
const GridBackground = React.memo(() => {
    return (
        <View style={styles.gridContainer}>
            <SvgAny height="100%" width="100%">
                <DefsAny>
                    <PatternAny
                        id="smallGrid"
                        width="40"
                        height="40"
                        patternUnits="userSpaceOnUse"
                    >
                        <PathAny
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke={ALTASAI_COLORS.border.primary}
                            strokeWidth="0.5"
                            opacity="0.3"
                        />
                    </PatternAny>
                    <LinearGradientAny id="fadeGrad" x1="0" y1="0" x2="0" y2="1">
                        <StopAny offset="0" stopColor="black" stopOpacity="0" />
                        <StopAny offset="0.5" stopColor="black" stopOpacity="0.8" />
                        <StopAny offset="1" stopColor="black" stopOpacity="1" />
                    </LinearGradientAny>
                </DefsAny>
                <RectAny width="100%" height="100%" fill="url(#smallGrid)" />
                <RectAny width="100%" height="100%" fill="url(#fadeGrad)" />
            </SvgAny>
        </View>
    );
});

// --- Single Interactive Particle ---
const InteractiveParticle = React.memo(({
    config,
    touchX,
    touchY,
    isPressed,
}: {
    config: ParticleConfig;
    touchX: SharedValue<number>;
    touchY: SharedValue<number>;
    isPressed: SharedValue<number>;
}) => {
    // Base floating animation
    const driftX = useSharedValue(config.initialX);
    const driftY = useSharedValue(config.initialY);
    const twinkle = useSharedValue(config.opacity);

    useEffect(() => {
        // Slow, random drift motion
        const targetX = Math.random() * width;
        const targetY = Math.random() * height;
        const duration = (8000 + Math.random() * 12000) / config.speed;

        driftX.value = withRepeat(
            withTiming(targetX, {
                duration,
                easing: Easing.inOut(Easing.ease),
            }),
            -1,
            true
        );
        driftY.value = withRepeat(
            withTiming(targetY, {
                duration: duration * 1.2,
                easing: Easing.inOut(Easing.ease),
            }),
            -1,
            true
        );

        // Twinkle/pulse effect
        twinkle.value = withRepeat(
            withDelay(
                Math.random() * 3000,
                withTiming(0.15 + Math.random() * 0.3, {
                    duration: 2000 + Math.random() * 3000,
                    easing: Easing.inOut(Easing.ease),
                })
            ),
            -1,
            true
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Computed position: base drift + touch displacement
    const animatedStyle = useAnimatedStyle(() => {
        const baseX = driftX.value;
        const baseY = driftY.value;

        // Calculate distance from touch point
        const dx = baseX - touchX.value;
        const dy = baseY - touchY.value;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // If within touch radius and finger is down, particles get attracted
        let offsetX = 0;
        let offsetY = 0;
        let scaleBoost = 1;
        let opacityBoost = 0;

        if (dist < TOUCH_RADIUS && isPressed.value > 0) {
            // Strength falls off with distance (stronger when closer)
            const strength = interpolate(
                dist,
                [0, TOUCH_RADIUS],
                [1, 0]
            );

            // Attract particles TOWARD the finger (negative displacement)
            const angle = Math.atan2(dy, dx);
            const pull = strength * 35 * isPressed.value;
            offsetX = -Math.cos(angle) * pull;
            offsetY = -Math.sin(angle) * pull;

            // Scale up and brighten particles near touch
            scaleBoost = 1 + strength * 1.5 * isPressed.value;
            opacityBoost = strength * 0.4 * isPressed.value;
        }

        return {
            transform: [
                { translateX: baseX + offsetX },
                { translateY: baseY + offsetY },
                { scale: scaleBoost },
            ],
            opacity: (twinkle.value + opacityBoost) * (0.6 + isPressed.value * 0.4),
        };
    });

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    width: config.size,
                    height: config.size,
                    borderRadius: config.size / 2,
                    backgroundColor: config.color,
                    shadowColor: config.color,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: config.size * 2,
                },
                animatedStyle,
            ]}
        />
    );
});

// --- Floating Orb (existing, ambient glow) ---
const FloatingOrb = React.memo(({ color }: { color: string }) => {
    const translateX = useSharedValue(Math.random() * width);
    const translateY = useSharedValue(Math.random() * height);
    const scale = useSharedValue(0.8 + Math.random() * 0.4);

    useEffect(() => {
        translateX.value = withRepeat(
            withTiming(Math.random() * width, {
                duration: 10000 + Math.random() * 5000,
                easing: Easing.inOut(Easing.ease),
            }),
            -1,
            true
        );
        translateY.value = withRepeat(
            withTiming(Math.random() * height, {
                duration: 12000 + Math.random() * 6000,
                easing: Easing.inOut(Easing.ease),
            }),
            -1,
            true
        );
        scale.value = withRepeat(
            withTiming(1.2, {
                duration: 4000,
                easing: Easing.inOut(Easing.ease),
            }),
            -1,
            true
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const style = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    return (
        <Animated.View
            style={[
                styles.orb,
                {
                    backgroundColor: color,
                    shadowColor: color,
                },
                style,
            ]}
        />
    );
});

// --- Touch Glow Ring (visual feedback at touch point) ---
const TouchGlow = React.memo(({
    touchX,
    touchY,
    isPressed,
}: {
    touchX: SharedValue<number>;
    touchY: SharedValue<number>;
    isPressed: SharedValue<number>;
}) => {
    const glowStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: touchX.value - 60 },
            { translateY: touchY.value - 60 },
            { scale: 0.5 + isPressed.value * 0.5 },
        ],
        opacity: isPressed.value * 0.25,
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    borderWidth: 1,
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    shadowColor: '#8B5CF6',
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.5,
                    shadowRadius: 30,
                    pointerEvents: 'none',
                },
                glowStyle,
            ]}
        />
    );
});

// --- Main Component ---
interface CyberBackgroundProps {
    children?: React.ReactNode;
    showGrid?: boolean;
    interactive?: boolean;
    intensity?: 'low' | 'medium' | 'high';
}

export const CyberBackground = ({ children, showGrid = true, interactive = true, intensity = 'medium' }: CyberBackgroundProps) => {
    // Touch state (shared across all particles)
    const touchX = useSharedValue(-200);
    const touchY = useSharedValue(-200);
    const isPressed = useSharedValue(0);

    // Generate particle configs once
    const particles = useMemo(() => generateParticles(), []);
    const visualIntensity = intensity === 'high' ? 1 : intensity === 'low' ? 0.55 : 0.8;

    // Pan gesture for touch-reactive particles (mobile drag / web drag)
    const panGesture = Gesture.Pan()
        .onBegin((e) => {
            touchX.value = e.absoluteX;
            touchY.value = e.absoluteY;
            isPressed.value = withSpring(1, { damping: 15, stiffness: 200 });
        })
        .onUpdate((e) => {
            touchX.value = e.absoluteX;
            touchY.value = e.absoluteY;
        })
        .onFinalize(() => {
            isPressed.value = withTiming(0, { duration: 600 });
        });

    // Hover gesture for web (mouse move without clicking)
    const hoverGesture = Gesture.Hover()
        .onBegin((e) => {
            touchX.value = e.absoluteX;
            touchY.value = e.absoluteY;
            isPressed.value = withSpring(0.8, { damping: 15, stiffness: 200 }); // Slightly weaker than press
        })
        .onUpdate((e) => {
            touchX.value = e.absoluteX;
            touchY.value = e.absoluteY;
        })
        .onFinalize(() => {
            isPressed.value = withTiming(0, { duration: 600 });
        });

    // Combine gestures so both work seamlessly
    const composedGesture = Gesture.Simultaneous(panGesture, hoverGesture);

    return (
        <View style={styles.container}>
            {/* 1. Deep Background */}
            <View style={styles.backgroundFill} />

            {/* 2. Ambient Floating Orbs (large blurry glows) */}
            <View style={[styles.orbsContainer, { opacity: 0.3 * visualIntensity }]}>
                {ORB_COLORS.map((color, i) => (
                    <FloatingOrb key={`orb-${i}`} color={color} />
                ))}
            </View>

            {/* 3. Interactive Particle Field */}
            {interactive && (
                <GestureDetector gesture={composedGesture}>
                    <View style={[styles.particleLayer, { opacity: visualIntensity }]} collapsable={false}>
                        {/* Touch glow ring */}
                        <TouchGlow
                            touchX={touchX}
                            touchY={touchY}
                            isPressed={isPressed}
                        />

                        {/* All particles */}
                        {particles.map((config) => (
                            <InteractiveParticle
                                key={`particle-${config.id}`}
                                config={config}
                                touchX={touchX}
                                touchY={touchY}
                                isPressed={isPressed}
                            />
                        ))}
                    </View>
                </GestureDetector>
            )}

            {/* 4. Grid Overlay */}
            {showGrid && <GridBackground />}

            {/* 5. Content */}
            <View style={styles.contentContainer}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: ALTASAI_COLORS.background.primary,
        overflow: 'hidden',
    },
    backgroundFill: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#050508',
    },
    orbsContainer: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.3,
    },
    orb: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
        opacity: 0.4,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 50,
    },
    gridContainer: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.6,
    },
    particleLayer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 5,
    },
    contentContainer: {
        flex: 1,
        zIndex: 10,
    },
});
