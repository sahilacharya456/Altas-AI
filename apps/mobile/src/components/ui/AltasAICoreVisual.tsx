import React, { useEffect, useMemo } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import {
  ALTASAI_COLORS,
  ALTASAI_MOTION,
  ALTASAI_SPACING,
  ALTASAI_TYPOGRAPHY,
} from '../../theme';

interface AltasAICoreVisualProps {
  size?: number;
  variant?: 'altasai' | 'cortex';
  label?: string;
  showCaption?: boolean;
  showLabels?: boolean;
  reducedMotion?: boolean;
  style?: StyleProp<ViewStyle>;
}

const PARTICLE_COUNT = 34;

export const AltasAICoreVisual = ({
  size = 260,
  variant = 'altasai',
  label,
  showCaption = false,
  showLabels = false,
  reducedMotion = false,
  style,
}: AltasAICoreVisualProps) => {
  const pulse = useSharedValue(0);
  const rotation = useSharedValue(0);
  const reverseRotation = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;

    pulse.value = withRepeat(
      withTiming(1, {
        duration: ALTASAI_MOTION.duration.corePulse,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
    rotation.value = withRepeat(
      withTiming(360, {
        duration: ALTASAI_MOTION.duration.coreOrbit,
        easing: Easing.linear,
      }),
      -1,
      false
    );
    reverseRotation.value = withRepeat(
      withTiming(-360, {
        duration: ALTASAI_MOTION.duration.coreOrbit * 1.42,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [pulse, reducedMotion, reverseRotation, rotation]);

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }).map((_, index) => {
        const angle = (Math.PI * 2 * index) / PARTICLE_COUNT;
        const ring = index % 4;
        const radius = size * (ring === 0 ? 0.39 : ring === 1 ? 0.32 : ring === 2 ? 0.24 : 0.44);
        const dotSize = index % 9 === 0 ? size * 0.014 : index % 5 === 0 ? size * 0.011 : size * 0.0075;
        return {
          key: `particle-${index}`,
          left: size / 2 + Math.cos(angle) * radius - dotSize / 2,
          top: size / 2 + Math.sin(angle) * radius - dotSize / 2,
          opacity: index % 6 === 0 ? 0.92 : index % 3 === 0 ? 0.64 : 0.44,
          size: dotSize,
        };
      }),
    [size]
  );

  const corePulseStyle = useAnimatedStyle(() => ({
    opacity: 0.88 + pulse.value * 0.12,
    transform: [{ scale: 1 + pulse.value * 0.04 }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.34 + pulse.value * 0.22,
    transform: [{ scale: 0.94 + pulse.value * 0.08 }],
  }));

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const reverseOrbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${reverseRotation.value}deg` }],
  }));

  const containerStyle = { width: size, height: size, borderRadius: size / 2 };
  const center = size / 2;
  const coreRadius = size * 0.112;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label ?? (variant === 'cortex' ? 'Cortex intelligence core' : 'AltasAI intelligence core')}
      style={[styles.container, containerStyle, style]}
    >
      <Animated.View style={[styles.outerGlow, { borderRadius: size / 2 }, haloStyle]} />
      <View style={[styles.depthShadow, { width: size * 0.62, height: size * 0.10, borderRadius: size * 0.05 }]} />

      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="coreGlow" cx="50%" cy="48%" r="52%">
            <Stop offset="0%" stopColor="#ECFFF8" stopOpacity="0.96" />
            <Stop offset="22%" stopColor="#A6FFE7" stopOpacity="0.84" />
            <Stop offset="48%" stopColor="#35E8B4" stopOpacity="0.26" />
            <Stop offset="100%" stopColor="#020403" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="fieldGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#35E8B4" stopOpacity="0.10" />
            <Stop offset="52%" stopColor="#0D7A5D" stopOpacity="0.07" />
            <Stop offset="100%" stopColor="#020403" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Circle cx={center} cy={center} r={size * 0.48} fill="url(#fieldGlow)" />
        {[0.46, 0.37, 0.285, 0.205].map((factor, index) => (
          <Circle
            key={`ring-${factor}`}
            cx={center}
            cy={center}
            r={size * factor}
            fill="none"
            stroke={index === 0 ? 'rgba(166, 255, 231, 0.24)' : 'rgba(166, 255, 231, 0.14)'}
            strokeWidth={index === 0 ? 0.8 : 0.65}
            strokeDasharray={index % 2 === 0 ? `${size * 0.018} ${size * 0.032}` : undefined}
          />
        ))}

        <G opacity="0.18">
          {Array.from({ length: variant === 'cortex' ? 10 : 7 }).map((_, index) => {
            const angle = (Math.PI * 2 * index) / (variant === 'cortex' ? 10 : 7);
            return (
              <Line
                key={`ray-${index}`}
                x1={center + Math.cos(angle) * size * 0.16}
                y1={center + Math.sin(angle) * size * 0.16}
                x2={center + Math.cos(angle) * size * 0.45}
                y2={center + Math.sin(angle) * size * 0.45}
                stroke="rgba(166, 255, 231, 0.40)"
                strokeWidth="0.45"
              />
            );
          })}
        </G>

        <Circle cx={center} cy={center} r={size * 0.19} fill="url(#coreGlow)" opacity="0.72" />
      </Svg>

      <Animated.View style={[styles.orbitLayer, orbitStyle]}>
        <View style={[styles.ellipticRing, { width: size * 0.86, height: size * 0.30, borderRadius: size * 0.15 }]} />
        <View style={[styles.tiltedRing, { width: size * 0.76, height: size * 0.26, borderRadius: size * 0.13 }]} />
        {particles.slice(0, Math.floor(PARTICLE_COUNT * 0.62)).map((particle) => (
          <View
            key={particle.key}
            style={[
              styles.particle,
              {
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                left: particle.left,
                top: particle.top,
                opacity: particle.opacity,
              },
            ]}
          />
        ))}
      </Animated.View>

      <Animated.View style={[styles.reverseOrbitLayer, reverseOrbitStyle]}>
        {particles.slice(Math.floor(PARTICLE_COUNT * 0.62)).map((particle) => (
          <View
            key={particle.key}
            style={[
              styles.particle,
              styles.dimParticle,
              {
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                left: particle.left,
                top: particle.top,
                opacity: particle.opacity * 0.78,
              },
            ]}
          />
        ))}
      </Animated.View>

      <Animated.View
        style={[
          styles.core,
          {
            width: coreRadius * 2,
            height: coreRadius * 2,
            borderRadius: coreRadius,
            left: center - coreRadius,
            top: center - coreRadius,
          },
          corePulseStyle,
        ]}
      >
        <View style={[styles.coreInner, { width: coreRadius * 0.72, height: coreRadius * 0.72, borderRadius: coreRadius * 0.36 }]} />
      </Animated.View>

      {showLabels ? (
        <View style={styles.labelStack}>
          <Text style={styles.microLabel}>SIGNAL ACTIVE</Text>
        </View>
      ) : null}

      {showCaption ? (
        <View style={styles.caption}>
          <Text style={styles.captionEyebrow}>{variant === 'cortex' ? 'CORTEX CORE' : 'ALTASAI CORE'}</Text>
          <Text style={styles.captionText}>{label ?? 'Cortex is tracking the signal.'}</Text>
        </View>
      ) : null}
    </View>
  );
};

export const CortexCoreVisual = (props: Omit<AltasAICoreVisualProps, 'variant'>) => (
  <AltasAICoreVisual {...props} variant="cortex" />
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  outerGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: ALTASAI_COLORS.intelligence.glow,
    shadowColor: ALTASAI_COLORS.intelligence.core,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'web' ? 0.16 : 0.44,
    shadowRadius: Platform.OS === 'web' ? 18 : 46,
  },
  depthShadow: {
    position: 'absolute',
    bottom: '18%',
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    opacity: 0.72,
    transform: [{ scaleX: 1.12 }],
  },
  orbitLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  reverseOrbitLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  ellipticRing: {
    position: 'absolute',
    left: '7%',
    top: '35%',
    borderWidth: 1,
    borderColor: 'rgba(166, 255, 231, 0.18)',
    transform: [{ rotate: '-16deg' }],
  },
  tiltedRing: {
    position: 'absolute',
    left: '12%',
    top: '38%',
    borderWidth: 1,
    borderColor: 'rgba(53, 232, 180, 0.17)',
    transform: [{ rotate: '28deg' }],
  },
  particle: {
    position: 'absolute',
    backgroundColor: ALTASAI_COLORS.intelligence.particle,
    shadowColor: ALTASAI_COLORS.intelligence.core,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'web' ? 0.26 : 0.7,
    shadowRadius: Platform.OS === 'web' ? 4 : 8,
  },
  dimParticle: {
    backgroundColor: 'rgba(166, 255, 231, 0.72)',
  },
  core: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(166, 255, 231, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(236, 255, 248, 0.72)',
    shadowColor: ALTASAI_COLORS.intelligence.core,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'web' ? 0.32 : 0.88,
    shadowRadius: Platform.OS === 'web' ? 12 : 28,
  },
  coreInner: {
    backgroundColor: 'rgba(236, 255, 248, 0.94)',
    shadowColor: ALTASAI_COLORS.intelligence.core,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'web' ? 0.36 : 0.95,
    shadowRadius: Platform.OS === 'web' ? 8 : 18,
  },
  labelStack: {
    position: 'absolute',
    top: '18%',
    paddingHorizontal: ALTASAI_SPACING.sm,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(166, 255, 231, 0.12)',
    backgroundColor: 'rgba(2, 4, 3, 0.42)',
  },
  microLabel: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: 8,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    letterSpacing: 0,
  },
  caption: {
    position: 'absolute',
    bottom: ALTASAI_SPACING.lg,
    alignItems: 'center',
    paddingHorizontal: ALTASAI_SPACING.lg,
  },
  captionEyebrow: {
    color: ALTASAI_COLORS.intelligence.core,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    letterSpacing: 0,
  },
  captionText: {
    marginTop: 2,
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
    textAlign: 'center',
  },
});
