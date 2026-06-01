import React, { useEffect } from 'react';
import { Text, StyleSheet, ActivityIndicator, ViewStyle, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { safeImpactAsync, ImpactFeedbackStyle } from '../../utils/haptics';
import { ALTASAI_COLORS } from '../../theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../theme/typography';
import { ALTASAI_SPACING } from '../../theme/spacing';
import { ALTASAI_RADIUS } from '../../theme/radius';
import { ALTASAI_MOTION } from '../../theme/motion';
import { ALTASAI_SCREENS } from '../../theme/index';
const theme = { colors: ALTASAI_COLORS, typography: ALTASAI_TYPOGRAPHY, spacing: ALTASAI_SPACING, radius: ALTASAI_RADIUS, animation: ALTASAI_MOTION, screens: ALTASAI_SCREENS };

interface AnimatedButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
}) => {
  const scale = useSharedValue(1);
  const glowIntensity = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const idlePulse = useSharedValue(0);

  // Subtle idle pulse animation for glow variant to draw attention
  useEffect(() => {
    if (variant === 'glow' && !disabled) {
      idlePulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, disabled]);

  const tap = Gesture.Tap()
    .enabled(!disabled && !loading)
    .onBegin(() => {
      scale.value = withSpring(0.95, theme.animation.spring.snappy);
      glowIntensity.value = withSpring(1, theme.animation.spring.snappy);
    })
    .onFinalize((_, success) => {
      scale.value = withSequence(
        withSpring(1.02, { damping: 10, stiffness: 400 }),
        withSpring(1, theme.animation.spring.gentle)
      );
      glowIntensity.value = withSpring(0, theme.animation.spring.gentle);

      if (success) {
        // Only trigger haptics on native platforms
        if (Platform.OS !== 'web') {
          safeImpactAsync(ImpactFeedbackStyle.Light);
        }
        // Trigger shimmer effect on successful tap
        shimmer.value = 0;
        shimmer.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
        onPress?.();
      }
    });

  const animatedContainer = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
  }));

  const animatedGlow = useAnimatedStyle(() => {
    const baseOpacity = glowIntensity.value * 0.6;
    const pulseOpacity = variant === 'glow'
      ? interpolate(idlePulse.value, [0, 1], [0.2, 0.5])
      : 0;

    return {
      opacity: Math.max(baseOpacity, pulseOpacity),
      transform: [{ scale: 1 + glowIntensity.value * 0.1 + idlePulse.value * 0.05 }],
    };
  });

  // Shimmer flash effect on tap
  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.3, 1], [0, 0.4, 0]),
  }));

  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14 },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16 },
    lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 18 },
  };

  const variantConfig = {
    primary: {
      gradient: [theme.colors.primary.DEFAULT, theme.colors.primary.dark],
      textColor: '#FFFFFF',
      glowColor: theme.colors.primary.glow,
    },
    secondary: {
      gradient: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'],
      textColor: theme.colors.text.primary,
      glowColor: 'rgba(255,255,255,0.2)',
    },
    ghost: {
      gradient: ['transparent', 'transparent'],
      textColor: theme.colors.primary.light,
      glowColor: theme.colors.primary.glow,
    },
    glow: {
      gradient: [theme.colors.accent.DEFAULT, theme.colors.accent.dark],
      textColor: '#000000',
      glowColor: theme.colors.accent.glow,
    },
  };

  const config = variantConfig[variant];
  const currentSize = sizeStyles[size];

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        style={[
          styles.container,
          fullWidth && styles.fullWidth,
          animatedContainer,
          style,
        ]}
      >
        {/* Glow layer */}
        {variant !== 'ghost' && (
          <Animated.View
            style={[
              styles.glowLayer,
              { backgroundColor: config.glowColor },
              animatedGlow,
            ]}
          />
        )}

        <LinearGradient
          colors={config.gradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              paddingVertical: currentSize.paddingVertical,
              paddingHorizontal: currentSize.paddingHorizontal,
            },
            variant === 'ghost' && styles.ghostBorder,
          ]}
        >
          {/* Shimmer overlay */}
          <Animated.View style={[styles.shimmerOverlay, shimmerStyle]} />

          {loading ? (
            <ActivityIndicator color={config.textColor} size="small" />
          ) : (
            <>
              {icon && <Animated.View style={styles.icon}>{icon}</Animated.View>}
              <Text
                style={[
                  styles.text,
                  { color: config.textColor, fontSize: currentSize.fontSize },
                ]}
              >
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  fullWidth: {
    width: '100%',
  },
  glowLayer: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: theme.radius.xl,
    opacity: 0,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  ghostBorder: {
    borderWidth: 1,
    borderColor: theme.colors.primary.DEFAULT,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0,
    textAlign: 'center',
  },
});
