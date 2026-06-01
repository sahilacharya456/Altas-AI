import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, TextStyle, View } from 'react-native';
import {
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ALTASAI_COLORS } from '../../theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../theme/typography';
import { ALTASAI_SPACING } from '../../theme/spacing';
const theme = { colors: ALTASAI_COLORS, typography: ALTASAI_TYPOGRAPHY, spacing: ALTASAI_SPACING };

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: TextStyle;
  glowColor?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 1500,
  prefix = '',
  suffix = '',
  decimals = 0,
  style,
  glowColor,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });

    // Update display value
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease out
      const current = startValue + diff * eased;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const formattedValue = displayValue.toFixed(decimals);

  return (
    <View style={styles.container}>
      {glowColor && (
        <Text
          style={[
            styles.number,
            style,
            styles.glow,
            { textShadowColor: glowColor },
          ]}
        >
          {prefix}{formattedValue}{suffix}
        </Text>
      )}
      <Text style={[styles.number, style]}>
        {prefix}{formattedValue}{suffix}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  number: {
    color: theme.colors.text.primary,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  glow: {
    position: 'absolute',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
});
