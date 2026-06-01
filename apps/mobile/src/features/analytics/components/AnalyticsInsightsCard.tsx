import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GlassCard, PulseCircle } from '../../../components/ui';
import { theme } from '../../../theme';
import { styles } from './analyticsStyles';

interface AnalyticsInsightsCardProps {
  insights: string[];
}

export function AnalyticsInsightsCard({ insights }: AnalyticsInsightsCardProps) {
  return (
    <Animated.View entering={FadeInUp.delay(800).duration(600)}>
      <GlassCard glow glowColor="rgba(0, 217, 255, 0.2)" style={styles.insightsCard}>
        <View style={styles.insightsHeader}>
          <View style={styles.insightsTitleRow}>
            <PulseCircle size={10} color={theme.colors.accent.DEFAULT} pulseCount={2} />
            <Text style={styles.insightsTitle}>AI INSIGHTS</Text>
          </View>
        </View>

        <View style={styles.insightsList}>
          {insights.map((insight, index) => (
            <View key={`${insight}-${index}`} style={styles.insightRow}>
              <Text style={styles.insightBullet}>{'\u2022'}</Text>
              <Text style={styles.insightText}>{insight}</Text>
            </View>
          ))}
        </View>
      </GlassCard>
    </Animated.View>
  );
}
