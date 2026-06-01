import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  type SharedValue,
} from 'react-native-reanimated';
import { ALTASAI_COLORS } from '../../theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../theme/typography';
import { ALTASAI_SPACING } from '../../theme/spacing';
const theme = { colors: ALTASAI_COLORS, typography: ALTASAI_TYPOGRAPHY, spacing: ALTASAI_SPACING };

interface PulseCircleProps {
  size?: number;
  color?: string;
  pulseCount?: number;
  children?: React.ReactNode;
}

export const PulseCircle: React.FC<PulseCircleProps> = ({
  size = 80,
  color = theme.colors.accent.DEFAULT,
  pulseCount = 3,
  children,
}) => {
  const pulseA = useSharedValue(0);
  const pulseB = useSharedValue(0);
  const pulseC = useSharedValue(0);
  const activePulseCount = Math.max(1, Math.min(pulseCount, 3));
  const pulses = [pulseA, pulseB, pulseC].slice(0, activePulseCount);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    pulses.forEach((pulse, index) => {
      pulse.value = withDelay(
        index * 400,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 2000, easing: Easing.out(Easing.ease) }),
            withTiming(0, { duration: 0 })
          ),
          -1,
          false
        )
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulseA, pulseB, pulseC, activePulseCount]);

  return (
    <View style={[styles.container, { width: size * 2, height: size * 2 }]}>
      {/* Pulse rings */}
      {pulses.map((pulse, index) => (
        <PulseRing
          key={index}
          pulse={pulse}
          size={size}
          color={color}
        />
      ))}

      {/* Core circle */}
      <View
        style={[
          styles.core,
          {
            width: size * 0.5,
            height: size * 0.5,
            borderRadius: size * 0.25,
            backgroundColor: color,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const PulseRing = ({ pulse, size, color }: { pulse: SharedValue<number>; size: number; color: string }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pulse.value, [0, 1], [0.5, 2]) },
    ],
    opacity: interpolate(pulse.value, [0, 0.5, 1], [0.6, 0.3, 0]),
  }));

  return (
    <Animated.View
      style={[
        styles.pulse,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    borderWidth: 2,
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00D9FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
});
