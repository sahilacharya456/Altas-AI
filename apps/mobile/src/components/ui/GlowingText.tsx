import React, { useEffect } from 'react';
import { Text, StyleSheet, TextStyle, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { ALTASAI_COLORS } from '../../theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../theme/typography';
import { ALTASAI_SPACING } from '../../theme/spacing';
const theme = { colors: ALTASAI_COLORS, typography: ALTASAI_TYPOGRAPHY, spacing: ALTASAI_SPACING };

interface GlowingTextProps {
  children: string;
  style?: TextStyle;
  glowColor?: string;
  intensity?: 'low' | 'medium' | 'high';
  animate?: boolean;
}

export const GlowingText: React.FC<GlowingTextProps> = ({
  children,
  style,
  glowColor = theme.colors.primary.DEFAULT,
  intensity = 'medium',
  animate = true,
}) => {
  const glow = useSharedValue(0.5);

  const intensityValues = {
    low: { min: 0.3, max: 0.6, blur: 10 },
    medium: { min: 0.4, max: 0.8, blur: 15 },
    high: { min: 0.5, max: 1, blur: 20 },
  };

  const config = intensityValues[intensity];

  useEffect(() => {
    if (animate) {
      glow.value = withRepeat(
        withSequence(
          withTiming(config.max, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(config.min, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate]);

  const glowStyle = useAnimatedStyle(() => ({
    textShadowColor: glowColor,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: interpolate(glow.value, [0, 1], [5, config.blur]),
    opacity: interpolate(glow.value, [0, 1], [0.8, 1]),
  }));

  return (
    <View style={styles.container}>
      {/* Shadow layer for extra glow */}
      <Animated.Text
        style={[
          styles.text,
          style,
          { color: glowColor, position: 'absolute' },
          glowStyle,
        ]}
      >
        {children}
      </Animated.Text>
      {/* Main text */}
      <Text style={[styles.text, style]}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  text: {
    color: theme.colors.text.primary,
  },
});
