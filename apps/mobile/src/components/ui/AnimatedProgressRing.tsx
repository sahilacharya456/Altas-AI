import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  useDerivedValue,
  useAnimatedStyle,
  interpolate,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const SvgAny = Svg as any;
const CircleAny = Circle as any;
const DefsAny = Defs as any;
const LinearGradientAny = LinearGradient as any;
const StopAny = Stop as any;
import { ALTASAI_COLORS } from '../../theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../theme/typography';
import { ALTASAI_SPACING } from '../../theme/spacing';
const theme = { colors: ALTASAI_COLORS, typography: ALTASAI_TYPOGRAPHY, spacing: ALTASAI_SPACING };

const AnimatedCircleAny = Animated.createAnimatedComponent(Circle) as any;

interface AnimatedProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  label?: string;
  gradientColors?: [string, string];
  backgroundColor?: string;
  animated?: boolean;
}

export const AnimatedProgressRing: React.FC<AnimatedProgressRingProps> = ({
  progress,
  size = 160,
  strokeWidth = 12,
  showPercentage = true,
  label,
  gradientColors = [theme.colors.primary.light, theme.colors.accent.DEFAULT],
  backgroundColor = 'rgba(255, 255, 255, 0.05)',
  animated = true,
}) => {
  const animatedProgress = useSharedValue(0);
  const glowPulse = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  useEffect(() => {
    if (animated) {
      animatedProgress.value = withTiming(progress, {
        duration: 1500,
        easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
      });
    } else {
      animatedProgress.value = progress;
    }

    // Pulse glow effect
    glowPulse.value = withTiming(1, { duration: 2000 }, () => {
      glowPulse.value = withTiming(0.6, { duration: 2000 });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, animated]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  })) as any;

  const displayProgress = useDerivedValue(() => {
    return Math.round(animatedProgress.value * 100);
  });

  const percentageStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animatedProgress.value, [0, 0.1], [0.5, 1]),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0.6, 1], [0.3, 0.6]),
    transform: [{ scale: interpolate(glowPulse.value, [0.6, 1], [0.95, 1.05]) }],
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: size + 40,
            height: size + 40,
            borderRadius: (size + 40) / 2,
            backgroundColor: gradientColors[0],
            top: -20,
            left: -20,
          },
          glowStyle,
        ]}
      />

      <SvgAny width={size} height={size} style={styles.svg}>
        <DefsAny>
          <LinearGradientAny id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <StopAny offset="0%" stopColor={gradientColors[0]} />
            <StopAny offset="100%" stopColor={gradientColors[1]} />
          </LinearGradientAny>
        </DefsAny>

        {/* Background circle */}
        <CircleAny
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <AnimatedCircleAny
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </SvgAny>

      {/* Center content */}
      <View style={styles.centerContent}>
        {showPercentage && (
          <Animated.View style={percentageStyle}>
            <AnimatedPercentage value={displayProgress} />
          </Animated.View>
        )}
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    </View>
  );
};

// Animated number component using useAnimatedReaction for smooth updates
const AnimatedPercentage = ({ value }: { value: SharedValue<number> }) => {
  return (
    <View style={styles.percentage}>
      <AnimatedNumber value={value} />
      <Text style={styles.percentSign}>%</Text>
    </View>
  );
};

const AnimatedNumber = ({ value }: { value: SharedValue<number> }) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  const animatedScale = useSharedValue(1);

  // Use useDerivedValue with runOnJS for efficient updates
  useDerivedValue(() => {
    const newValue = Math.round(value.value);
    runOnJS(setDisplayValue)(newValue);
    return newValue;
  }, [value]);

  // Subtle scale animation when value changes significantly
  React.useEffect(() => {
    animatedScale.value = withSequence(
      withTiming(1.05, { duration: 100 }),
      withSpring(1, { damping: 15, stiffness: 200 })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayValue]);

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animatedScale.value }],
  }));

  return (
    <Animated.Text style={[styles.number, numberStyle]}>
      {displayValue}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  glow: {
    position: 'absolute',
    opacity: 0.3,
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  number: {
    fontSize: 42,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 0,
  },
  percentSign: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginLeft: 2,
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
