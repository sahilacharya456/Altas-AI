import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ALTASAI_COLORS } from '../../src/theme/colors';
import { ALTASAI_SPACING } from '../../src/theme/spacing';
import { ALTASAI_TYPOGRAPHY } from '../../src/theme/typography';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import { openSubscriptionCheckout } from '../../src/services/ai/billing';
import { useToastStore } from '../../src/stores/toastStore';

type Plan = {
  tier: 'pro' | 'team';
  name: string;
  price: string;
  description: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    tier: 'pro',
    name: 'AltasAI Pro',
    price: '$8/mo',
    description: 'For one operator who wants a serious execution system.',
    features: [
      '60 mentor messages per day',
      'Conversation memory',
      'Proof review and GitHub verification',
      'Full analytics and reports',
      '200 active tasks and 20 goals',
    ],
  },
  {
    tier: 'team',
    name: 'AltasAI Team',
    price: '$24/mo',
    description: 'For shared accountability and heavier workflows.',
    features: [
      '120 mentor messages per day',
      'Team-grade execution limits',
      '100 proof reviews per day',
      '500 active tasks and 50 goals',
      'All Pro intelligence modules',
    ],
  },
];

export default function SubscriptionScreen() {
  const { limits, isLoading, fetch } = useSubscriptionStore();
  const showToast = useToastStore((state) => state.showToast);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const paymentStatus = limits.payments;
  const isConfigured = Boolean(paymentStatus?.available);
  const activeLabel = useMemo(() => limits.tier.toUpperCase(), [limits.tier]);

  const handleCheckout = async (tier: 'pro' | 'team') => {
    try {
      setLoadingTier(tier);
      await openSubscriptionCheckout(tier);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not open checkout.', 'error');
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[ALTASAI_COLORS.background.primary, ALTASAI_COLORS.background.secondary, ALTASAI_COLORS.background.tertiary]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={ALTASAI_COLORS.text.primary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>BILLING</Text>
            <Text style={styles.title}>AltasAI Subscription</Text>
          </View>
          {isLoading ? <ActivityIndicator color={ALTASAI_COLORS.accent.bright} /> : null}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statusPanel}>
            <View>
              <Text style={styles.statusLabel}>Current tier</Text>
              <Text style={styles.statusValue}>{activeLabel}</Text>
            </View>
            <View style={[styles.configBadge, isConfigured ? styles.configReady : styles.configBlocked]}>
              <Ionicons
                name={isConfigured ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={isConfigured ? ALTASAI_COLORS.success.light : ALTASAI_COLORS.warning.light}
              />
              <Text style={[styles.configText, isConfigured ? styles.configTextReady : styles.configTextBlocked]}>
                {isConfigured ? 'Checkout ready' : 'Setup needed'}
              </Text>
            </View>
          </View>

          {!isConfigured ? (
            <View style={styles.setupPanel}>
              <Text style={styles.setupTitle}>Stripe is installed, but Checkout needs a valid secret key.</Text>
              <Text style={styles.setupText}>
                {paymentStatus?.message ?? 'Set Stripe backend environment variables before accepting payments.'}
              </Text>
              <View style={styles.setupChecks}>
                <SetupCheck label="Checkout key" ok={Boolean(paymentStatus?.hasCheckoutKey)} />
                <SetupCheck label="Pro price" ok={Boolean(paymentStatus?.hasProPrice)} />
                <SetupCheck label="Webhook secret" ok={Boolean(paymentStatus?.hasWebhookSecret)} />
              </View>
            </View>
          ) : null}

          {PLANS.map((plan) => {
            const isActive = limits.tier === plan.tier;
            const isLoadingPlan = loadingTier === plan.tier;
            return (
              <View key={plan.tier} style={[styles.planPanel, isActive && styles.planPanelActive]}>
                <View style={styles.planTop}>
                  <View>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  </View>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                </View>

                <View style={styles.featureList}>
                  {plan.features.map((feature) => (
                    <View key={feature} style={styles.featureRow}>
                      <Ionicons name="checkmark" size={16} color={ALTASAI_COLORS.accent.bright} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleCheckout(plan.tier)}
                  disabled={isActive || isLoadingPlan || !isConfigured}
                  style={[styles.planButton, (isActive || !isConfigured) && styles.planButtonDisabled]}
                >
                  <Text style={styles.planButtonText}>
                    {isActive ? 'Current plan' : isLoadingPlan ? 'Opening Checkout...' : `Choose ${plan.tier === 'pro' ? 'Pro' : 'Team'}`}
                  </Text>
                </Pressable>
              </View>
            );
          })}

          <View style={styles.footerNote}>
            <Ionicons name="lock-closed" size={15} color={ALTASAI_COLORS.text.tertiary} />
            <Text style={styles.footerText}>Payments are created on the backend. No Stripe secret key is stored in the mobile app.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function SetupCheck({ label, ok }: { label: string; ok: boolean }) {
  return (
    <View style={styles.setupCheck}>
      <Ionicons name={ok ? 'checkmark-circle' : 'close-circle'} size={16} color={ok ? ALTASAI_COLORS.success.light : ALTASAI_COLORS.warning.light} />
      <Text style={styles.setupCheckText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ALTASAI_COLORS.background.primary },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ALTASAI_SPACING[3],
    paddingHorizontal: ALTASAI_SPACING[5],
    paddingVertical: ALTASAI_SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: ALTASAI_COLORS.accent.bright,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    letterSpacing: 1,
  },
  title: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size['2xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    letterSpacing: 0,
  },
  content: { padding: ALTASAI_SPACING[5], paddingBottom: 120, gap: ALTASAI_SPACING[4] },
  statusPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ALTASAI_SPACING[4],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  statusLabel: { color: ALTASAI_COLORS.text.tertiary, fontSize: ALTASAI_TYPOGRAPHY.size.xs },
  statusValue: { color: ALTASAI_COLORS.text.primary, fontSize: ALTASAI_TYPOGRAPHY.size.xl, fontWeight: ALTASAI_TYPOGRAPHY.weight.bold },
  configBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  configReady: { backgroundColor: 'rgba(16,185,129,0.10)', borderColor: 'rgba(16,185,129,0.25)' },
  configBlocked: { backgroundColor: 'rgba(245,158,11,0.10)', borderColor: 'rgba(245,158,11,0.25)' },
  configText: { fontSize: ALTASAI_TYPOGRAPHY.size.xs, fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold },
  configTextReady: { color: ALTASAI_COLORS.success.light },
  configTextBlocked: { color: ALTASAI_COLORS.warning.light },
  setupPanel: {
    padding: ALTASAI_SPACING[4],
    borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.22)',
    gap: ALTASAI_SPACING[3],
  },
  setupTitle: { color: ALTASAI_COLORS.text.primary, fontSize: ALTASAI_TYPOGRAPHY.size.base, fontWeight: ALTASAI_TYPOGRAPHY.weight.bold },
  setupText: { color: ALTASAI_COLORS.text.secondary, fontSize: ALTASAI_TYPOGRAPHY.size.sm, lineHeight: 20 },
  setupChecks: { flexDirection: 'row', flexWrap: 'wrap', gap: ALTASAI_SPACING[2] },
  setupCheck: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.18)' },
  setupCheckText: { color: ALTASAI_COLORS.text.secondary, fontSize: ALTASAI_TYPOGRAPHY.size.xs, fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold },
  planPanel: {
    padding: ALTASAI_SPACING[5],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(12,18,27,0.86)',
    gap: ALTASAI_SPACING[4],
  },
  planPanelActive: { borderColor: 'rgba(56,189,248,0.42)' },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', gap: ALTASAI_SPACING[4] },
  planName: { color: ALTASAI_COLORS.text.primary, fontSize: ALTASAI_TYPOGRAPHY.size.lg, fontWeight: ALTASAI_TYPOGRAPHY.weight.bold },
  planDescription: { color: ALTASAI_COLORS.text.secondary, fontSize: ALTASAI_TYPOGRAPHY.size.sm, lineHeight: 20, marginTop: 4, maxWidth: 210 },
  planPrice: { color: ALTASAI_COLORS.accent.bright, fontSize: ALTASAI_TYPOGRAPHY.size.lg, fontWeight: ALTASAI_TYPOGRAPHY.weight.bold },
  featureList: { gap: ALTASAI_SPACING[2] },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: ALTASAI_SPACING[2] },
  featureText: { flex: 1, color: ALTASAI_COLORS.text.secondary, fontSize: ALTASAI_TYPOGRAPHY.size.sm, lineHeight: 20 },
  planButton: { minHeight: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: ALTASAI_COLORS.accent.primary },
  planButtonDisabled: { opacity: 0.46 },
  planButtonText: { color: '#FFFFFF', fontSize: ALTASAI_TYPOGRAPHY.size.sm, fontWeight: ALTASAI_TYPOGRAPHY.weight.bold },
  footerNote: { flexDirection: 'row', gap: ALTASAI_SPACING[2], alignItems: 'center', paddingHorizontal: ALTASAI_SPACING[2] },
  footerText: { flex: 1, color: ALTASAI_COLORS.text.tertiary, fontSize: ALTASAI_TYPOGRAPHY.size.xs, lineHeight: 17 },
});
