import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ROUTES } from '../../../constants/routes';
import { ALTASAI_COLORS } from '../../../theme/colors';
import { ALTASAI_SPACING } from '../../../theme/spacing';
import { ALTASAI_TYPOGRAPHY } from '../../../theme/typography';

interface MentorUpgradePromptProps {
  visible: boolean;
  reason: string;
  onDismiss: () => void;
}

const PRO_FEATURES = [
  '60 mentor messages/day',
  'GitHub commit auto-verification',
  'Conversation memory across sessions',
  'Full analytics dashboard',
  'Expanded tasks and goals',
];

export function MentorUpgradePrompt({ visible, reason, onDismiss }: MentorUpgradePromptProps) {
  const handleUpgrade = () => {
    onDismiss();
    router.push(ROUTES.MAIN.SUBSCRIPTION);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Animated.View entering={FadeIn.duration(250)} style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onDismiss} />

        <Animated.View entering={FadeInUp.delay(80).duration(380)} style={styles.sheet}>
          <Text style={styles.eyebrow}>ALTASAI PRO</Text>
          <Text style={styles.title}>Unlock the full mentor system.</Text>
          <Text style={styles.reason}>{reason}</Text>

          <View style={styles.featureList}>
            {PRO_FEATURES.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Text style={styles.featureTick}>OK</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.price}>From $8 / month - cancel anytime</Text>

          <Pressable onPress={handleUpgrade} style={styles.ctaButton}>
            <LinearGradient
              colors={['rgba(56, 189, 248, 0.92)', 'rgba(16, 185, 129, 0.80)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaLabel}>View Pro plans</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={onDismiss} style={styles.skipButton}>
            <Text style={styles.skipLabel}>Not now</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(5,8,12,0.88)' },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: ALTASAI_COLORS.background.elevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
    padding: ALTASAI_SPACING.lg,
    paddingBottom: ALTASAI_SPACING['2xl'],
    gap: ALTASAI_SPACING.sm,
  },
  eyebrow: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    color: ALTASAI_COLORS.accent.bright,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    letterSpacing: 1,
  },
  title: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xl,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: ALTASAI_COLORS.text.primary,
    lineHeight: 28,
  },
  reason: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.secondary,
    lineHeight: 20,
  },
  featureList: { gap: ALTASAI_SPACING[2], marginTop: ALTASAI_SPACING[1] },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: ALTASAI_SPACING[2] },
  featureTick: { fontSize: ALTASAI_TYPOGRAPHY.size.xs, color: ALTASAI_COLORS.success.primary, width: 22, fontWeight: ALTASAI_TYPOGRAPHY.weight.bold },
  featureText: { flex: 1, fontSize: ALTASAI_TYPOGRAPHY.size.sm, color: ALTASAI_COLORS.text.secondary, lineHeight: 20 },
  price: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.tertiary,
    textAlign: 'center',
    marginTop: ALTASAI_SPACING[1],
  },
  ctaButton: { borderRadius: 10, overflow: 'hidden', marginTop: ALTASAI_SPACING.sm },
  ctaGradient: { paddingVertical: ALTASAI_SPACING.md, alignItems: 'center' },
  ctaLabel: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  skipButton: { alignItems: 'center', paddingVertical: ALTASAI_SPACING.sm },
  skipLabel: { fontSize: ALTASAI_TYPOGRAPHY.size.sm, color: ALTASAI_COLORS.text.muted },
});
