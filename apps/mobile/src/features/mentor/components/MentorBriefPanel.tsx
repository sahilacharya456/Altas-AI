import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

import type { MentorModeConfig } from '../types';
import { styles } from './mentorStyles';

interface MentorBriefPanelProps {
  mode: MentorModeConfig;
}

export function MentorBriefPanel({ mode }: MentorBriefPanelProps) {
  return (
    <Animated.View entering={FadeInUp.delay(100).duration(520)} style={styles.briefPanel}>
      <LinearGradient
        colors={['rgba(56, 189, 248, 0.22)', 'rgba(16, 185, 129, 0.08)', 'rgba(255, 255, 255, 0.04)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.briefGradient}
      >
        <View style={styles.briefTopRow}>
          <Text style={styles.briefLabel}>{mode.name.toUpperCase()} MODE</Text>
          <View style={[styles.modeDot, { backgroundColor: mode.color }]} />
        </View>
        <Text style={styles.briefTitle}>Discipline console armed.</Text>
        <Text style={styles.briefText}>
          The mentor uses your task, reflection, goal, and discipline signals to answer with direct next actions.
        </Text>
      </LinearGradient>
    </Animated.View>
  );
}
