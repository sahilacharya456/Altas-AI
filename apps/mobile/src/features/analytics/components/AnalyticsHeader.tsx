import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import type { AnalyticsRange } from '../types';
import { styles } from './analyticsStyles';

interface AnalyticsHeaderProps {
  ranges: AnalyticsRange[];
  selectedRange: AnalyticsRange;
  onRangeChange: (range: AnalyticsRange) => void;
}

export function AnalyticsHeader({ ranges, selectedRange, onRangeChange }: AnalyticsHeaderProps) {
  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Your Performance Insights</Text>
      </View>

      <View style={styles.rangeSelector}>
        {ranges.map((range) => (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: selectedRange === range }}
            key={range}
            onPress={() => onRangeChange(range)}
            style={[styles.rangeButton, selectedRange === range && styles.rangeButtonActive]}
          >
            <Text
              style={[
                styles.rangeButtonText,
                selectedRange === range && styles.rangeButtonTextActive,
              ]}
            >
              {range}
            </Text>
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}
