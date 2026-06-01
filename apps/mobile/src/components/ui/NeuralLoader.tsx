import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { ALTASAI_COLORS } from '../../theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../theme/typography';
import { ALTASAI_SPACING } from '../../theme/spacing';
const theme = { colors: ALTASAI_COLORS, typography: ALTASAI_TYPOGRAPHY, spacing: ALTASAI_SPACING };

const SvgAny = Svg as React.ComponentType<any>;
const CircleAny = Circle as React.ComponentType<any>;
const DefsAny = Defs as React.ComponentType<any>;
const RadialGradientAny = RadialGradient as React.ComponentType<any>;
const StopAny = Stop as React.ComponentType<any>;

interface NeuralLoaderProps {
  size?: number;
  color?: string;
  intensity?: 'subtle' | 'normal' | 'intense';
}

export const NeuralLoader: React.FC<NeuralLoaderProps> = ({
  size = 60,
  color = theme.colors.primary.DEFAULT,
  intensity = 'normal',
}) => {
  const pulse1 = useSharedValue(0);
  const pulse2 = useSharedValue(0);
  const pulse3 = useSharedValue(0);
  const rotation = useSharedValue(0);
  const breathe = useSharedValue(0);

  // Intensity-based timing
  const timingConfig = {
    subtle: { pulseDuration: 2000, rotationDuration: 12000 },
    normal: { pulseDuration: 1500, rotationDuration: 8000 },
    intense: { pulseDuration: 1000, rotationDuration: 5000 },
  }[intensity];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Smooth breathing animation for the core
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: timingConfig.pulseDuration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: timingConfig.pulseDuration, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );

    // Staggered pulse animations with smoother easing
    pulse1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: timingConfig.pulseDuration, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: timingConfig.pulseDuration, easing: Easing.in(Easing.cubic) })
      ),
      -1,
      false
    );

    pulse2.value = withDelay(
      timingConfig.pulseDuration * 0.2,
      withRepeat(
        withSequence(
          withTiming(1, { duration: timingConfig.pulseDuration, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: timingConfig.pulseDuration, easing: Easing.in(Easing.cubic) })
        ),
        -1,
        false
      )
    );

    pulse3.value = withDelay(
      timingConfig.pulseDuration * 0.4,
      withRepeat(
        withSequence(
          withTiming(1, { duration: timingConfig.pulseDuration, easing: Easing.out(Easing.cubic) }),
          withTiming(0, { duration: timingConfig.pulseDuration, easing: Easing.in(Easing.cubic) })
        ),
        -1,
        false
      )
    );

    // Smooth continuous rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: timingConfig.rotationDuration, easing: Easing.linear }),
      -1,
      false
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pulse1.value, [0, 1], [0.3, 1]) },
    ],
    opacity: interpolate(pulse1.value, [0, 0.5, 1], [0.8, 0.4, 0]),
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pulse2.value, [0, 1], [0.3, 1]) },
    ],
    opacity: interpolate(pulse2.value, [0, 0.5, 1], [0.6, 0.3, 0]),
  }));

  const ring3Style = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pulse3.value, [0, 1], [0.3, 1]) },
    ],
    opacity: interpolate(pulse3.value, [0, 0.5, 1], [0.4, 0.2, 0]),
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(breathe.value, [0, 1], [0.85, 1.15]) },
    ],
    opacity: interpolate(breathe.value, [0, 0.5, 1], [0.7, 1, 0.7]),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.ringContainer, containerStyle]}>
        {/* Outer rings */}
        <Animated.View
          style={[
            styles.ring,
            { width: size, height: size, borderColor: color },
            ring3Style,
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            { width: size * 0.8, height: size * 0.8, borderColor: color },
            ring2Style,
          ]}
        />
        <Animated.View
          style={[
            styles.ring,
            { width: size * 0.6, height: size * 0.6, borderColor: color },
            ring1Style,
          ]}
        />
      </Animated.View>

      {/* Core */}
      <Animated.View style={[styles.core, coreStyle]}>
        <SvgAny width={size * 0.3} height={size * 0.3}>
          <DefsAny>
            <RadialGradientAny id="coreGradient" cx="50%" cy="50%" r="50%">
              <StopAny offset="0%" stopColor={color} stopOpacity={1} />
              <StopAny offset="100%" stopColor={color} stopOpacity={0.3} />
            </RadialGradientAny>
          </DefsAny>
          <CircleAny
            cx={size * 0.15}
            cy={size * 0.15}
            r={size * 0.12}
            fill="url(#coreGradient)"
          />
        </SvgAny>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 2,
  },
  core: {
    position: 'absolute',
  },
});
