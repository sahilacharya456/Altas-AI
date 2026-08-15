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

export default function MentorScreen() {
  return (
    <ScreenContainer>
      <Animated.View entering={altasaiCardEntrance(0)}>
        <AppHeader
          eyebrow="AI Mentor"
          title="Your discipline coach"
          subtitle="Proactive guidance based on your behavioral data."
        />
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(1)}>
        <SectionHeader title="Cortex" subtitle="AI-powered behavioral intelligence." />
        <CommandCard eyebrow="Active" title="Cortex is watching">
          <Text style={styles.body}>
            The Cortex engine aggregates your task, health, finance, and reflection data to generate proactive interventions and mentor recommendations.
          </Text>
          <GradientButton
            title="Open Cortex"
            size="sm"
            onPress={() => router.push(ROUTES.MAIN.CORTEX as any)}
          />
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(2)}>
        <SectionHeader title="Interventions" subtitle="Proactive signals from your data." />
        <CommandCard eyebrow="Alerts" title="Active interventions">
          <Text style={styles.body}>
            Interventions are generated when Cortex detects patterns requiring your attention — missed tasks, declining health, or financial signals.
          </Text>
          <GradientButton
            title="View interventions"
            size="sm"
            variant="secondary"
            onPress={() => router.push(ROUTES.MAIN.INTERVENTIONS as any)}
          />
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(3)}>
        <SectionHeader title="Reports" subtitle="Daily and weekly intelligence reports." />
        <CommandCard eyebrow="Intelligence" title="Performance reports">
          <Text style={styles.body}>
            View AI-generated daily summaries and weekly behavioral reports tailored to your command profile.
          </Text>
          <GradientButton
            title="View reports"
            size="sm"
            variant="ghost"
            onPress={() => router.push(ROUTES.MAIN.REPORTS as any)}
          />
        </CommandCard>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { color: ALTASAI_COLORS.text.secondary, fontSize: ALTASAI_TYPOGRAPHY.size.sm, lineHeight: ALTASAI_TYPOGRAPHY.size.sm * 1.6, marginBottom: ALTASAI_TYPOGRAPHY.size.sm },
});
