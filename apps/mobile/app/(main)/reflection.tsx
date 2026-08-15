import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { ScreenContainer, AppHeader } from '../../src/components/layout';
import { CommandCard } from '../../src/components/cards';
import { GradientButton, SectionHeader } from '../../src/components/common';
import { ALTASAI_COLORS, ALTASAI_TYPOGRAPHY } from '../../src/theme';
import { altasaiCardEntrance } from '../../src/utils/animations';
import { ROUTES } from '../../src/constants/routes';

export default function ReflectionScreen() {
  return (
    <ScreenContainer>
      <Animated.View entering={altasaiCardEntrance(0)}>
        <AppHeader
          eyebrow="Reflection"
          title="Daily debrief"
          subtitle="Honest self-assessment. No excuses, only signal."
        />
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(1)}>
        <SectionHeader title="Daily log" subtitle="Review what happened today." />
        <CommandCard eyebrow="Today" title="How did you execute?">
          <Text style={styles.body}>
            Log your wins, struggles, energy, and mood. AltasAI uses this as a behavioral signal for the Cortex engine.
          </Text>
          <GradientButton
            title="Open daily report"
            size="sm"
            onPress={() => router.push(ROUTES.MAIN.DAILY_REPORT as any)}
          />
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(2)}>
        <SectionHeader title="Weekly review" subtitle="Pattern recognition across 7 days." />
        <CommandCard eyebrow="This week" title="Weekly performance">
          <Text style={styles.body}>
            View your weekly execution score, task completion rate, and behavioral trends.
          </Text>
          <GradientButton
            title="Open weekly report"
            size="sm"
            variant="secondary"
            onPress={() => router.push(ROUTES.MAIN.WEEKLY_REPORT as any)}
          />
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(3)}>
        <SectionHeader title="Behavior timeline" subtitle="Every event that shaped your score." />
        <CommandCard eyebrow="Audit trail" title="What Cortex recorded">
          <Text style={styles.body}>
            Every task completion, carry, reflection, and health log is recorded as a behavioral event.
          </Text>
          <GradientButton
            title="View timeline"
            size="sm"
            variant="ghost"
            onPress={() => router.push(ROUTES.MAIN.BEHAVIOR_TIMELINE as any)}
          />
        </CommandCard>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { color: ALTASAI_COLORS.text.secondary, fontSize: ALTASAI_TYPOGRAPHY.size.sm, lineHeight: ALTASAI_TYPOGRAPHY.size.sm * 1.6, marginBottom: ALTASAI_TYPOGRAPHY.size.sm },
});
