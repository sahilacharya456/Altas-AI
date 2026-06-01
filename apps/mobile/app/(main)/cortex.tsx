import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Animated from 'react-native-reanimated';

import { AppHeader, ScreenContainer } from '../../src/components/layout';
import { GradientButton, SectionHeader } from '../../src/components/common';
import { CommandCard, InsightCard, InterventionCard, StatCard } from '../../src/components/cards';
import { EmptyState, ErrorState, LoadingState, RiskBadge } from '../../src/components/feedback';
import { ProgressRing } from '../../src/components/charts';
import { CortexCoreVisual } from '../../src/components/ui';
import { ROUTES } from '../../src/constants/routes';
import {
  getCortexDocument,
  getCortexRiskState,
  getRecentCortexEvents,
  listActiveInterventions,
  createTaskFromIntervention,
  ignoreIntervention,
} from '../../src/services/data';
import { useAuthStore } from '../../src/stores/authStore';
import {
  ALTASAI_COLORS,
  ALTASAI_SPACING,
  ALTASAI_TYPOGRAPHY,
} from '../../src/theme';
import { altasaiCardEntrance } from '../../src/utils/animations';
import { convertToDate } from '../../src/utils/dateUtils';
import type { BehaviorEvent, CortexRiskState, Intervention } from '../../src/types/firestore';

interface CortexPatterns {
  primaryPatterns?: string[];
  disciplineTrend?: string;
  weeklySummary?: string;
}

interface CortexWeekly {
  reflectionEntries?: number;
  averageEnergy?: number | null;
  eventCount?: number;
  placeholder?: string;
}

export default function CortexScreen() {
  const { user } = useAuthStore();
  const [riskState, setRiskState] = useState<CortexRiskState | null>(null);
  const [patterns, setPatterns] = useState<CortexPatterns | null>(null);
  const [weekly, setWeekly] = useState<CortexWeekly | null>(null);
  const [events, setEvents] = useState<BehaviorEvent[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCortex = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setError(null);
      const [risk, loadedPatterns, loadedWeekly, loadedEvents, loadedInterventions] = await Promise.all([
        getCortexRiskState(user.uid),
        getCortexDocument<CortexPatterns>('patterns').catch(() => null),
        getCortexDocument<CortexWeekly>('weekly').catch(() => null),
        getRecentCortexEvents(user.uid, 5).catch(() => []),
        listActiveInterventions(user.uid, 5).catch(() => []),
      ]);
      setRiskState(risk);
      setPatterns(loadedPatterns);
      setWeekly(loadedWeekly);
      setEvents(loadedEvents);
      setInterventions(loadedInterventions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Cortex.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  const acceptInterventionCard = async (intervention: Intervention) => {
    if (!user?.uid) return;
    await createTaskFromIntervention(intervention, user.uid);
    setInterventions(await listActiveInterventions(user.uid, 5));
  };

  const ignoreInterventionCard = async (intervention: Intervention) => {
    if (!user?.uid || !intervention.id) return;
    await ignoreIntervention(intervention.id);
    setInterventions(await listActiveInterventions(user.uid, 5));
  };

  useEffect(() => {
    loadCortex();
  }, [loadCortex]);

  if (isLoading) return <LoadingState title="Loading Cortex" />;

  return (
    <ScreenContainer
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadCortex();
            }}
            tintColor={ALTASAI_COLORS.accent.bright}
            colors={[ALTASAI_COLORS.accent.bright]}
          />
        ),
      }}
    >
      <Animated.View entering={altasaiCardEntrance(0)}>
        <AppHeader
          eyebrow="Cortex"
          title="Behavior intelligence"
          subtitle="Deterministic risk and pattern analysis across AltasAI signals."
          right={<GradientButton title="Timeline" size="sm" variant="secondary" onPress={() => router.push(ROUTES.MAIN.BEHAVIOR_TIMELINE as any)} />}
        />
      </Animated.View>

      {error ? <ErrorState title="Cortex did not load cleanly" message={error} actionLabel="Retry" onAction={loadCortex} /> : null}

      <Animated.View entering={altasaiCardEntrance(1)}>
        <CommandCard eyebrow="Cortex Core" title="Signals are becoming risk intelligence.">
          <View style={styles.coreLayout}>
            <CortexCoreVisual size={146} label="Risk, patterns, interventions." />
            <View style={styles.coreCopy}>
              <Text style={styles.bodyText}>
                Cortex maps tasks, reflections, focus, finance, health, digital, and security signals into one behavior layer.
              </Text>
              <Text style={styles.placeholderText}>No AI provider is required for the deterministic signal layer.</Text>
            </View>
          </View>
        </CommandCard>
      </Animated.View>

      {riskState ? (
        <>
          <Animated.View entering={altasaiCardEntrance(2)}>
            <CommandCard
              eyebrow="Risk state"
              title={`${riskState.riskLevel.toUpperCase()} execution risk`}
              right={<RiskBadge level={riskState.riskLevel} />}
            >
              <View style={styles.riskLayout}>
                <ProgressRing
                  progress={riskState.executionRiskScore / 100}
                  size={148}
                  strokeWidth={12}
                  label="Risk"
                  gradientColors={[ALTASAI_COLORS.warning.light, ALTASAI_COLORS.error.light]}
                />
                <View style={styles.riskCopy}>
                  <Text style={styles.riskScore}>{riskState.executionRiskScore}/100</Text>
                  <Text style={styles.bodyText}>{riskState.recommendedAction}</Text>
                </View>
              </View>
            </CommandCard>
          </Animated.View>

          <Animated.View entering={altasaiCardEntrance(3)}>
            <View style={styles.statsGrid}>
              <StatCard label="Pending" value={riskState.signalSnapshot.pendingTaskCount} helper="Task pressure" tone="warning" style={styles.statCard} />
              <StatCard label="Carried" value={riskState.signalSnapshot.carriedTaskCount} helper="Execution debt" tone={riskState.signalSnapshot.carriedTaskCount ? 'danger' : 'neutral'} style={styles.statCard} />
              <StatCard label="Overdue" value={riskState.signalSnapshot.missedOrOverdueTaskCount} helper="Missed timing" tone={riskState.signalSnapshot.missedOrOverdueTaskCount ? 'danger' : 'neutral'} style={styles.statCard} />
            </View>
          </Animated.View>

          <Animated.View entering={altasaiCardEntrance(4)}>
            <InsightCard
              eyebrow="Recommended intervention"
              title="Next best action"
              body={riskState.recommendedAction}
              risk={riskState.riskLevel}
            />
          </Animated.View>

          <Animated.View entering={altasaiCardEntrance(5)}>
            <SectionHeader title="Reasons" subtitle="Deterministic signals currently increasing risk." />
            <View style={styles.reasonList}>
              {riskState.reasons.map((reason) => (
                <CommandCard key={reason} title={reason} eyebrow="Signal">
                  <Text style={styles.bodyText}>Cortex will use this signal when generating interventions and reports.</Text>
                </CommandCard>
              ))}
            </View>
          </Animated.View>
        </>
      ) : (
        <EmptyState title="No Cortex risk state" message="Cortex will appear after AltasAI can read your local signals." />
      )}

      <Animated.View entering={altasaiCardEntrance(6)}>
        <SectionHeader
          title="Intervention cards"
          subtitle="Rule-generated actions from current risk."
          action={<GradientButton title="All" size="sm" variant="secondary" onPress={() => router.push(ROUTES.MAIN.INTERVENTIONS as any)} />}
        />
        <View style={styles.eventList}>
          {interventions.length ? interventions.map((intervention) => (
            <InterventionCard
              key={intervention.id}
              intervention={intervention}
              compact
              onAccept={() => acceptInterventionCard(intervention)}
              onIgnore={() => ignoreInterventionCard(intervention)}
            />
          )) : (
            <EmptyState title="No active interventions" message="Cortex will create cards when deterministic rules detect risk." />
          )}
        </View>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(7)}>
        <SectionHeader title="Patterns" subtitle="Early behavior pattern extraction." />
        <CommandCard eyebrow="Patterns" title="Current read">
          {(patterns?.primaryPatterns?.length ? patterns.primaryPatterns : ['No major pattern is established yet.']).map((pattern) => (
            <Text key={pattern} style={styles.bodyText}>- {pattern}</Text>
          ))}
          <Text style={styles.placeholderText}>{patterns?.weeklySummary ?? 'Pattern confidence will improve as history grows.'}</Text>
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(8)}>
        <SectionHeader title="Weekly summary" subtitle="Placeholder until enough signal history exists." />
        <CommandCard eyebrow="Weekly" title="Discipline trend">
          <Text style={styles.bodyText}>Reflection entries: {weekly?.reflectionEntries ?? 0}</Text>
          <Text style={styles.bodyText}>Average energy: {weekly?.averageEnergy?.toFixed?.(1) ?? 'Not enough data'}</Text>
          <Text style={styles.bodyText}>Behavior events: {weekly?.eventCount ?? events.length}</Text>
          <Text style={styles.placeholderText}>{weekly?.placeholder ?? 'Weekly Cortex reports will mature after more behavior data is available.'}</Text>
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(9)}>
        <SectionHeader title="Recent behavior events" subtitle="Latest signals feeding Cortex." />
        <View style={styles.eventList}>
          {events.length ? events.map((event) => (
            <CommandCard
              key={event.id ?? `${event.eventType}-${event.title}`}
              eyebrow={`${event.source} - ${convertToDate(event.createdAt).toLocaleDateString()}`}
              title={event.title}
              right={<RiskBadge level={event.severity} />}
            >
              <Text style={styles.bodyText}>{event.message}</Text>
            </CommandCard>
          )) : (
            <EmptyState title="No behavior events yet" message="Task, goal, reflection, and focus events will appear here." />
          )}
        </View>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  coreLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ALTASAI_SPACING.md,
  },
  coreCopy: {
    flex: 1,
  },
  riskLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ALTASAI_SPACING.lg,
  },
  riskCopy: {
    flex: 1,
  },
  riskScore: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size['3xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    marginBottom: ALTASAI_SPACING.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: ALTASAI_SPACING.sm,
  },
  statCard: {
    flex: 1,
  },
  reasonList: {
    gap: ALTASAI_SPACING.sm,
  },
  eventList: {
    gap: ALTASAI_SPACING.sm,
  },
  bodyText: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
    marginBottom: ALTASAI_SPACING.xs,
  },
  placeholderText: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
    marginTop: ALTASAI_SPACING.sm,
  },
});
