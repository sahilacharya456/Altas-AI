import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  interpolateColor,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { safeImpactAsync, safeNotificationAsync, ImpactFeedbackStyle, NotificationFeedbackType } from '../../utils/haptics';
import { ALTASAI_COLORS } from '../../theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../theme/typography';
import { ALTASAI_SPACING } from '../../theme/spacing';
import { ALTASAI_RADIUS } from '../../theme/radius';
import { ALTASAI_MOTION } from '../../theme/motion';
import { ALTASAI_SCREENS } from '../../theme/index';
const theme = { colors: ALTASAI_COLORS, typography: ALTASAI_TYPOGRAPHY, spacing: ALTASAI_SPACING, radius: ALTASAI_RADIUS, animation: ALTASAI_MOTION, screens: ALTASAI_SCREENS };

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const THRESHOLD_INDICATOR = SWIPE_THRESHOLD * 0.8; // Visual indicator appears at 80%

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  rightLabel?: string;
  leftLabel?: string;
  rightColor?: string;
  leftColor?: string;
  disabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = 'Complete',
  leftLabel = 'Reschedule',
  rightColor = theme.colors.success.DEFAULT,
  leftColor = theme.colors.warning.DEFAULT,
  disabled = false,
}) => {
  const translateX = useSharedValue(0);
  const context = useSharedValue({ x: 0 });
  const hasTriggeredHaptic = useSharedValue(false);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      safeImpactAsync(ImpactFeedbackStyle.Medium);
    }
  };

  const triggerSuccess = () => {
    if (Platform.OS !== 'web') {
      safeNotificationAsync(NotificationFeedbackType.Success);
    }
  };

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      context.value = { x: translateX.value };
      hasTriggeredHaptic.value = false;
    })
    .onUpdate((event) => {
      translateX.value = event.translationX + context.value.x;

      // Trigger haptic at threshold
      if (
        !hasTriggeredHaptic.value &&
        Math.abs(translateX.value) > SWIPE_THRESHOLD * 0.8
      ) {
        hasTriggeredHaptic.value = true;
        runOnJS(triggerHaptic)();
      }
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD && onSwipeRight) {
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 200 });
        runOnJS(triggerSuccess)();
        runOnJS(onSwipeRight)();
      } else if (translateX.value < -SWIPE_THRESHOLD && onSwipeLeft) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
        runOnJS(triggerHaptic)();
        runOnJS(onSwipeLeft)();
      } else {
        translateX.value = withSpring(0, theme.animation.spring.gentle);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    // Add subtle elevation effect as user swipes
    const elevationScale = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [1, 1.02],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value } as const,
        {
          rotate: `${interpolate(
            translateX.value,
            [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
            [-8, 0, 8],
            Extrapolation.CLAMP
          )}deg`,
        } as const,
        { scale: elevationScale } as const,
      ],
    };
  });

  // Border glow that intensifies as user approaches threshold
  const cardBorderStyle = useAnimatedStyle(() => {
    const rightGlow = interpolateColor(
      translateX.value,
      [0, THRESHOLD_INDICATOR, SWIPE_THRESHOLD],
      ['rgba(255, 255, 255, 0.1)', 'rgba(0, 245, 160, 0.3)', 'rgba(0, 245, 160, 0.6)']
    );
    const leftGlow = interpolateColor(
      translateX.value,
      [0, -THRESHOLD_INDICATOR, -SWIPE_THRESHOLD],
      ['rgba(255, 255, 255, 0.1)', 'rgba(255, 184, 0, 0.3)', 'rgba(255, 184, 0, 0.6)']
    );

    const borderColor = translateX.value > 0 ? rightGlow : leftGlow;

    return {
      borderColor: Math.abs(translateX.value) > 10 ? borderColor : 'rgba(255, 255, 255, 0.1)',
    };
  });

  const rightActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [0, SWIPE_THRESHOLD],
          [0.8, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const leftActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD * 0.5, -SWIPE_THRESHOLD],
      [0, 0.5, 1],
      Extrapolation.CLAMP
    ),
    transform: [
      {
        scale: interpolate(
          translateX.value,
          [0, -SWIPE_THRESHOLD],
          [0.8, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const glowRightStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 0.6],
      Extrapolation.CLAMP
    ),
  }));

  const glowLeftStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      [0, 0.6],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <View style={styles.container}>
      {/* Right action (complete) */}
      <View style={[styles.actionContainer, styles.rightAction]}>
        <Animated.View style={[styles.glowEffect, { backgroundColor: rightColor }, glowRightStyle]} />
        <Animated.View style={[styles.actionContent, rightActionStyle]}>
          <Text style={styles.actionIcon}>✓</Text>
          <Text style={[styles.actionLabel, { color: rightColor }]}>{rightLabel}</Text>
        </Animated.View>
      </View>

      {/* Left action (reschedule) */}
      <View style={[styles.actionContainer, styles.leftAction]}>
        <Animated.View style={[styles.glowEffect, { backgroundColor: leftColor }, glowLeftStyle]} />
        <Animated.View style={[styles.actionContent, leftActionStyle]}>
          <Text style={styles.actionIcon}>↻</Text>
          <Text style={[styles.actionLabel, { color: leftColor }]}>{leftLabel}</Text>
        </Animated.View>
      </View>

      {/* Card */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, cardStyle, cardBorderStyle]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <View style={styles.cardBorder} />
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  actionContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightAction: {
    left: 20,
  },
  leftAction: {
    right: 20,
  },
  glowEffect: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0,
  },
  actionContent: {
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 4,
    color: theme.colors.text.primary,
  },
  actionLabel: {
    fontSize: theme.typography.size.sm,
    fontWeight: '600',
  },
  card: {
    borderRadius: theme.radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: theme.colors.glass.border,
    backgroundColor: 'rgba(15, 15, 36, 0.9)',
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  cardBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.colors.glass.highlight,
  },
});
