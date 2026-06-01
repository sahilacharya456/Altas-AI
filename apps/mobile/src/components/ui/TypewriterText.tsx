import React, { useEffect, useState, useRef } from 'react';
import { Text, StyleSheet, TextStyle, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { ALTASAI_COLORS } from '../../theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../theme/typography';
import { ALTASAI_SPACING } from '../../theme/spacing';
const theme = { colors: ALTASAI_COLORS, typography: ALTASAI_TYPOGRAPHY, spacing: ALTASAI_SPACING };

interface TypewriterTextProps {
  text: string;
  style?: TextStyle;
  speed?: number; // ms per character
  delay?: number; // initial delay (renamed from startDelay for consistency)
  startDelay?: number; // alias for delay
  typingSpeed?: number; // alias for speed
  onComplete?: () => void;
  showCursor?: boolean;
  cursorColor?: string;
  cursorStyle?: 'line' | 'block' | 'glow';
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  style,
  speed,
  delay,
  startDelay,
  typingSpeed,
  onComplete,
  showCursor = true,
  cursorColor = theme.colors.accent.DEFAULT,
  cursorStyle: cursorVariant = 'glow',
}) => {
  // Support both prop names for compatibility
  const actualSpeed = speed ?? typingSpeed ?? 30;
  const actualDelay = delay ?? startDelay ?? 0;

  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const cursorOpacity = useSharedValue(1);
  const cursorGlow = useSharedValue(0);
  const cursorScale = useSharedValue(1);
  const indexRef = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Premium cursor blink with glow pulse
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Glow animation for premium effect
    if (cursorVariant === 'glow') {
      cursorGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
          withTiming(0.4, { duration: 600, easing: Easing.in(Easing.ease) })
        ),
        -1,
        true
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursorVariant]);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayText('');
    setIsComplete(false);

    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (indexRef.current < text.length) {
          setDisplayText(text.slice(0, indexRef.current + 1));
          indexRef.current++;
          // Subtle cursor bounce on each character
          cursorScale.value = withSequence(
            withSpring(1.2, { damping: 15, stiffness: 300 }),
            withSpring(1, { damping: 15, stiffness: 300 })
          );
        } else {
          clearInterval(interval);
          setIsComplete(true);
          onComplete?.();
        }
      }, actualSpeed);

      return () => clearInterval(interval);
    }, actualDelay);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, actualSpeed, actualDelay]);

  const cursorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
    transform: [{ scaleY: cursorScale.value }],
  }));

  const cursorGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(cursorGlow.value, [0.4, 1], [0.3, 0.8]),
    transform: [{ scale: interpolate(cursorGlow.value, [0.4, 1], [1, 1.5]) }],
  }));

  return (
    <View style={styles.container}>
      <Text style={[styles.text, style]}>{displayText}</Text>
      {showCursor && !isComplete && (
        <View style={styles.cursorContainer}>
          {/* Glow effect behind cursor */}
          {cursorVariant === 'glow' && (
            <Animated.View
              style={[
                styles.cursorGlow,
                { backgroundColor: cursorColor },
                cursorGlowStyle,
              ]}
            />
          )}
          {/* Main cursor */}
          <Animated.View
            style={[
              styles.cursor,
              cursorVariant === 'block' && styles.cursorBlock,
              { backgroundColor: cursorColor },
              cursorAnimatedStyle,
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  text: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.size.base,
    lineHeight: 24,
  },
  cursorContainer: {
    position: 'relative',
    width: 3,
    height: 20,
    marginLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cursor: {
    width: 2,
    height: 20,
    borderRadius: 1,
  },
  cursorBlock: {
    width: 8,
    height: 18,
    borderRadius: 2,
  },
  cursorGlow: {
    position: 'absolute',
    width: 8,
    height: 24,
    borderRadius: 4,
  },
});
