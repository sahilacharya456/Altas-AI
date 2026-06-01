import React, { useEffect } from 'react';
import { View, ViewProps, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { safeImpactAsync, ImpactFeedbackStyle } from '../../utils/haptics';
import { ALTASAI_COLORS } from '../../theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../theme/typography';
import { ALTASAI_SPACING } from '../../theme/spacing';
import { ALTASAI_RADIUS } from '../../theme/radius';
import { ALTASAI_MOTION } from '../../theme/motion';
import { ALTASAI_SCREENS } from '../../theme/index';
const theme = { colors: ALTASAI_COLORS, typography: ALTASAI_TYPOGRAPHY, spacing: ALTASAI_SPACING, radius: ALTASAI_RADIUS, animation: ALTASAI_MOTION, screens: ALTASAI_SCREENS };

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'glow' | 'neon' | 'surface' | 'command';
  glowColor?: string;
  glow?: boolean;
  pressable?: boolean;
  onPress?: () => void;
  intensity?: number;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shimmer?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  glowColor = theme.colors.primary.DEFAULT,
  glow = false,
  pressable = false,
  onPress,
  intensity = 20,
  padding = 'md',
  shimmer = false,
  style,
  ...props
}) => {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);
  const shimmerPosition = useSharedValue(-1);

  // Shimmer is intentionally restrained. It should only be used for loading affordances.
  useEffect(() => {
    if (shimmer) {
      shimmerPosition.value = withDelay(
        1000,
        withRepeat(
          withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          -1,
          false
        )
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shimmer]);

  const tap = Gesture.Tap()
    .onBegin(() => {
      if (pressable) {
        scale.value = withSpring(0.97, theme.animation.spring.snappy);
        pressed.value = withSpring(1, theme.animation.spring.snappy);
      }
    })
    .onFinalize(() => {
      if (pressable) {
        scale.value = withSpring(1, theme.animation.spring.gentle);
        pressed.value = withSpring(0, theme.animation.spring.gentle);
        if (Platform.OS !== 'web') {
          safeImpactAsync(ImpactFeedbackStyle.Light);
        }
        onPress?.();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pressed.value, [0, 1], [0.3, 0.6]),
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmerPosition.value, [-1, 1], [-SCREEN_WIDTH, SCREEN_WIDTH]) },
      { rotate: '25deg' },
    ],
    opacity: 0.1,
  }));

  const paddingValue = {
    none: 0,
    sm: theme.spacing.sm,
    md: theme.spacing.md,
    lg: theme.spacing.lg,
  }[padding];

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[styles.container, animatedStyle, style]} {...props}>
        {/* Glow is opt-in and subtle; legacy neon maps to a quiet accent state. */}
        {(variant === 'glow' || variant === 'neon' || glow) && (
          <Animated.View
            style={[
              styles.glowLayer,
              glowStyle,
              { backgroundColor: glowColor },
            ]}
          />
        )}

        <View style={[
          styles.glassContainer,
          variant === 'elevated' && styles.elevated,
          variant === 'command' && styles.command,
        ]}>
          <BlurView intensity={Math.min(intensity, 10)} tint="dark" style={styles.blur}>
            <LinearGradient
              colors={variant === 'command'
                ? ['rgba(53, 232, 180, 0.075)', 'rgba(255, 255, 255, 0.020)']
                : ['rgba(255, 255, 255, 0.048)', 'rgba(255, 255, 255, 0.018)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            />
          </BlurView>

          {/* Shimmer effect */}
          {shimmer && (
            <Animated.View style={[styles.shimmer, shimmerStyle]}>
              <LinearGradient
                colors={[
                  'transparent',
                  'rgba(255, 255, 255, 0.16)',
                  'transparent',
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          )}

          {/* Border gradient */}
          <View style={styles.borderGradient} />

          {/* Content */}
          <View style={[styles.content, { padding: paddingValue }]}>
            {children}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  glowLayer: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: theme.radius['2xl'] + 20,
    opacity: 0.14,
    transform: [{ scale: 1.1 }],
  },
  glassContainer: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.surface.raised,
  },
  elevated: {
    backgroundColor: theme.colors.surface.command,
    borderColor: theme.colors.border.primary,
  },
  command: {
    backgroundColor: theme.colors.surface.command,
    borderColor: theme.colors.border.accent,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    position: 'absolute',
    top: -50,
    bottom: -50,
    width: 80,
  },
  shimmerGradient: {
    flex: 1,
  },
  borderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.colors.glass.highlight,
  },
  content: {
    position: 'relative',
  },
});
