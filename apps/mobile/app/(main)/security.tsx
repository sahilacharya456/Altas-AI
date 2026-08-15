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

export default function SecurityScreen() {
  return (
    <ScreenContainer>
      <Animated.View entering={altasaiCardEntrance(0)}>
        <AppHeader
          eyebrow="Security"
          title="Device & link protection"
          subtitle="AI-powered security scanning and threat detection."
        />
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(1)}>
        <SectionHeader title="Link scanner" subtitle="Scan URLs for phishing and malicious content." />
        <CommandCard eyebrow="AI analysis" title="Scan a link">
          <Text style={styles.body}>
            Paste any URL and AltasAI will analyze it for phishing patterns, suspicious domains, and malicious content using AI-powered detection.
          </Text>
          <GradientButton
            title="Open link scanner"
            size="sm"
            onPress={() => router.push(ROUTES.MAIN.SCAN_LINK as any)}
          />
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(2)}>
        <SectionHeader title="Device safety" subtitle="Review device security status." />
        <CommandCard eyebrow="Status" title="Device protection">
          <Text style={styles.body}>
            Review your device's security posture, recent security events, and AI recommendations for staying protected.
          </Text>
          <GradientButton
            title="View device safety"
            size="sm"
            variant="secondary"
            onPress={() => router.push(ROUTES.MAIN.DEVICE_SAFETY as any)}
          />
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(3)}>
        <SectionHeader title="Security events" subtitle="Recent alerts and threat history." />
        <CommandCard eyebrow="Log" title="Security event log">
          <Text style={styles.body}>
            All phishing attempts, suspicious links, and behavior alerts are logged here for review.
          </Text>
        </CommandCard>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { color: ALTASAI_COLORS.text.secondary, fontSize: ALTASAI_TYPOGRAPHY.size.sm, lineHeight: ALTASAI_TYPOGRAPHY.size.sm * 1.6, marginBottom: ALTASAI_TYPOGRAPHY.size.sm },
});
