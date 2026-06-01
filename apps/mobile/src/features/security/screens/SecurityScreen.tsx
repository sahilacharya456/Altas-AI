import React from 'react';
import { Image, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard, GradientBackground, AnimatedProgressRing } from '../../../components/ui';
import { ROUTES } from '../../../constants/routes';
import { ALTASAI_COLORS } from '../../../theme';
import { SecurityAnimatedPressable, ThreatCard } from '../components';
import { styles } from '../components/securityStyles';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { useSecurityDashboard } from '../hooks/useSecurityDashboard';

const getScoreColor = (score: number) => {
  if (score >= 80) return ALTASAI_COLORS.success.primary;
  if (score >= 60) return ALTASAI_COLORS.warning.primary;
  return ALTASAI_COLORS.error.primary;
};

export default function SecurityScreen() {
  const {
    trustScore,
    recentScans,
    refreshing,
    insight,
    onRefresh,
    handleAction,
    handleScanClipboard,
  } = useSecurityDashboard();
  const animatedTrustScore = useAnimatedNumber(trustScore);
  const displayedScore = Math.min(animatedTrustScore, insight.cyberDisciplineScore);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={ALTASAI_COLORS.text.primary}
            />
          }
        >
          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            <Image
              source={require('../../../../assets/images/security-scan.png')}
              style={styles.securityVisual}
              resizeMode="cover"
              accessibilityLabel="Security scan dashboard visual"
            />
            <Text style={styles.title}>Cyber Discipline Shield</Text>
            <Text style={styles.subtitle}>Security habits as Cortex behavior signals</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.scoreContainer}>
            <GlassCard variant="glow">
              <View style={styles.scoreContent}>
                <View style={styles.scoreInfo}>
                  <Text style={styles.scoreLabel}>Cyber Discipline Score</Text>
                  <Text style={[styles.scoreValue, { color: getScoreColor(displayedScore) }]}>
                    {displayedScore}/100
                  </Text>
                  <Text style={styles.scoreStatus}>
                    {trustScore >= 80 ? 'System Secure' : 'Attention Needed'}
                  </Text>
                </View>
                <View style={styles.ringContainer}>
                  <AnimatedProgressRing progress={trustScore / 100} size={80} strokeWidth={8} />
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250)} style={styles.scoreContainer}>
            <GlassCard>
              <Text style={styles.sectionTitle}>Latest insight</Text>
              <Text style={styles.signalText}>{insight.securityInsight}</Text>
              <Text style={styles.signalText}>
                Key action: scan unknown links, verify sender identity, and run the device checklist after suspicious activity.
              </Text>
              <Text style={styles.signalText}>
                Social engineering warning: urgency, money claims, account threats, and pressure to bypass verification are risk patterns.
              </Text>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)} style={styles.grid}>
            <SecurityAnimatedPressable
              style={styles.gridItem}
              onPress={() => handleAction('/(main)/scan-link')}
            >
              <GlassCard style={styles.actionCard}>
                <Text style={styles.actionTitle}>Scan Link</Text>
              </GlassCard>
            </SecurityAnimatedPressable>

            <SecurityAnimatedPressable style={styles.gridItem} onPress={handleScanClipboard}>
              <GlassCard style={styles.actionCard}>
                <Text style={styles.actionTitle}>Clipboard</Text>
              </GlassCard>
            </SecurityAnimatedPressable>

            <SecurityAnimatedPressable
              style={styles.gridItem}
              onPress={() => handleAction('/(main)/device-safety')}
            >
              <GlassCard style={styles.actionCard}>
                <Text style={styles.actionTitle}>Device Check</Text>
              </GlassCard>
            </SecurityAnimatedPressable>

            <SecurityAnimatedPressable
              style={styles.gridItem}
              onPress={() => handleAction(ROUTES.MAIN.MENTOR)}
            >
              <GlassCard style={styles.actionCard}>
                <Text style={styles.actionTitle}>Advisor</Text>
              </GlassCard>
            </SecurityAnimatedPressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentScans.length > 0 ? (
              recentScans.map((scan, index) => (
                <ThreatCard
                  key={scan.id ?? `${scan.input}-${index}`}
                  isThreat={scan.result.isThreat}
                  style={styles.threatWrap}
                >
                  <GlassCard style={styles.logCard}>
                    <View style={styles.logHeader}>
                      <Text style={styles.logType}>
                        {scan.type === 'url' ? 'Link Scan' : 'Text Scan'}
                      </Text>
                      <Text
                        style={[
                          styles.logStatus,
                          {
                            color: scan.result.isThreat
                              ? ALTASAI_COLORS.error.primary
                              : ALTASAI_COLORS.success.primary,
                          },
                        ]}
                      >
                        {scan.result.isThreat ? 'Threat Detected' : 'Safe'}
                      </Text>
                    </View>
                    <Text style={styles.logTarget} numberOfLines={1}>
                      {scan.input}
                    </Text>
                  </GlassCard>
                </ThreatCard>
              ))
            ) : (
              <Text style={styles.emptyState}>No recent scans recorded</Text>
            )}
          </Animated.View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              AltasAI Safety provides advisory analysis based on heuristics and known patterns. It does not replace dedicated antivirus software.
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
