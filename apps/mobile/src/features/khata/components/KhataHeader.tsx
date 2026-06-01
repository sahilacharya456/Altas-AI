import React from 'react';
import { Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { styles } from './khataStyles';

export function KhataHeader() {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
      <Text style={styles.title}>Smart Khata</Text>
      <Text style={styles.subtitle}>Financial Discipline</Text>
    </Animated.View>
  );
}
