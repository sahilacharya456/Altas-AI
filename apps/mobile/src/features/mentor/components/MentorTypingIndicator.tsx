import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { styles } from './mentorStyles';

interface MentorTypingIndicatorProps {
  label?: string;
}

export function MentorTypingIndicator({ label = 'AltasAI is analyzing' }: MentorTypingIndicatorProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [shimmer]);

  const barStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + shimmer.value * 0.65,
    transform: [{ scaleX: 0.72 + shimmer.value * 0.28 }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(240)} style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <Animated.View style={[styles.typingBar, barStyle]} />
        <Text style={styles.typingText}>{label}</Text>
      </View>
    </Animated.View>
  );
}
