import React, { useEffect } from 'react';
import { Image, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { MentorModeConfig } from '../types';
import { styles } from './mentorStyles';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mentorAvatar = require('../../../../assets/images/mentor-avatar.png') as number;

interface MentorHeaderProps {
  mode: MentorModeConfig;
  isOfflineFallback: boolean;
}

export function MentorHeader({ mode, isOfflineFallback }: MentorHeaderProps) {
  return (
    <Animated.View entering={FadeInDown.duration(520)} style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.avatarFrame}>
          <Image
            source={mentorAvatar}
            style={styles.avatarImage}
            resizeMode="cover"
            accessibilityLabel="AltasAI mentor avatar"
          />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.headerEyebrow}>{mode.name.toUpperCase()} MENTOR</Text>
          <Text style={styles.headerTitle}>AltasAI</Text>
        </View>
      </View>

      <StatusPill
        label={isOfflineFallback ? 'Offline fallback' : 'Secure backend'}
        tone={isOfflineFallback ? 'warning' : 'success'}
      />
    </Animated.View>
  );
}

function StatusPill({ label, tone = 'success' }: { label: string; tone?: 'success' | 'warning' }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulse]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + pulse.value * 0.55,
    transform: [{ scale: 0.85 + pulse.value * 0.35 }],
  }));

  return (
    <View style={styles.statusBadge}>
      <Animated.View style={[
        styles.statusDot,
        tone === 'warning' && styles.statusDotWarning,
        dotStyle,
      ]} />
      <Text style={[styles.statusText, tone === 'warning' && styles.statusTextWarning]}>{label}</Text>
    </View>
  );
}
