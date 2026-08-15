import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { ScreenContainer, AppHeader } from '../../src/components/layout';
import { CommandCard, StatCard } from '../../src/components/cards';
import { GradientButton, SectionHeader } from '../../src/components/common';
import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY, ALTASAI_RADIUS } from '../../src/theme';
import { altasaiCardEntrance } from '../../src/utils/animations';
import { useAuthStore, selectCurrentScores } from '../../src/stores/authStore';

export default function ProfileScreen() {
  const { user, profile, logout } = useAuthStore();
  const scores = useAuthStore(selectCurrentScores);

  const handleLogout = async () => {
    await logout();
  };

  const disciplineLevel = profile?.disciplineLevel ?? 'strict';
  const focusAreas = profile?.focusAreas ?? [];
  const wakeTime = profile?.lifeRhythm?.wakeTime ?? '06:00';
  const sleepTime = profile?.lifeRhythm?.sleepTime ?? '22:00';

  return (
    <ScreenContainer>
      <Animated.View entering={altasaiCardEntrance(0)}>
        <AppHeader
          eyebrow="Profile"
          title={profile?.displayName ?? user?.displayName ?? 'Commander'}
          subtitle={user?.email ?? 'No email on file'}
        />
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(1)}>
        <View style={styles.statsGrid}>
          <StatCard label="Discipline" value={scores.discipline} helper="/100" tone="info" style={styles.statCard} />
          <StatCard label="Productivity" value={scores.productivity} helper="/100" tone="warning" style={styles.statCard} />
          <StatCard label="Consistency" value={scores.consistency} helper="/100" tone="success" style={styles.statCard} />
        </View>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(2)}>
        <SectionHeader title="Command profile" subtitle="Your operating parameters." />
        <CommandCard eyebrow="Discipline mode" title={disciplineLevel.charAt(0).toUpperCase() + disciplineLevel.slice(1)}>
          <Text style={styles.body}>Focus areas: {focusAreas.length > 0 ? focusAreas.join(', ') : 'Not configured'}</Text>
          <Text style={styles.body}>Wake: {wakeTime} · Sleep: {sleepTime}</Text>
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(3)}>
        <SectionHeader title="Account" subtitle="Authentication and session management." />
        <CommandCard eyebrow="Session" title="Signed in">
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.verifiedRow}>
            <View style={[styles.badge, user?.emailVerified ? styles.badgeVerified : styles.badgePending]}>
              <Text style={styles.badgeText}>{user?.emailVerified ? '✓ Verified' : '⚠ Not verified'}</Text>
            </View>
          </View>
          <GradientButton
            title="Sign out"
            size="sm"
            variant="danger"
            onPress={handleLogout}
          />
        </CommandCard>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', gap: ALTASAI_SPACING.sm },
  statCard: { flex: 1 },
  body: { color: ALTASAI_COLORS.text.secondary, fontSize: ALTASAI_TYPOGRAPHY.size.sm, marginBottom: ALTASAI_SPACING.xs },
  email: { color: ALTASAI_COLORS.text.primary, fontSize: ALTASAI_TYPOGRAPHY.size.sm, marginBottom: ALTASAI_SPACING.sm },
  verifiedRow: { flexDirection: 'row', marginBottom: ALTASAI_SPACING.md },
  badge: { paddingHorizontal: ALTASAI_SPACING.sm, paddingVertical: 4, borderRadius: ALTASAI_RADIUS.full },
  badgeVerified: { backgroundColor: ALTASAI_COLORS.success.glow ?? 'rgba(34,197,94,0.15)' },
  badgePending: { backgroundColor: ALTASAI_COLORS.warning.glow ?? 'rgba(234,179,8,0.15)' },
  badgeText: { color: ALTASAI_COLORS.text.secondary, fontSize: ALTASAI_TYPOGRAPHY.size.xs, fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold },
});
