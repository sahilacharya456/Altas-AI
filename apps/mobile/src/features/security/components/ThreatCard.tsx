import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface ThreatCardProps {
  children: React.ReactNode;
  isThreat: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ThreatCard({ children, isThreat, style }: ThreatCardProps) {
  const glow = useSharedValue(0.1);

  useEffect(() => {
    if (isThreat) {
      glow.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 1000 }), withTiming(0.1, { duration: 1000 })),
        -1,
        true
      );
    }
  }, [glow, isThreat]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: isThreat ? `rgba(239, 68, 68, ${glow.value})` : 'transparent',
    borderWidth: isThreat ? 1 : 0,
    backgroundColor: isThreat ? `rgba(239, 68, 68, ${glow.value * 0.2})` : undefined,
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
