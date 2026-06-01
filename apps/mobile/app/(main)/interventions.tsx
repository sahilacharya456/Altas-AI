import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, View, StyleSheet } from 'react-native';

import { AppHeader, ScreenContainer } from '../../src/components/layout';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/feedback';
import { InterventionCard } from '../../src/components/cards';
import {
  createTaskFromIntervention,
  ignoreIntervention,
  completeIntervention,
  listActiveInterventions,
} from '../../src/services/data';
import { submitRecommendationFeedback } from '../../src/services/ai';
import { useAuthStore } from '../../src/stores/authStore';
import { ALTASAI_COLORS, ALTASAI_SPACING } from '../../src/theme';
import type { Intervention } from '../../src/types/firestore';

export default function InterventionsScreen() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setError(null);
      setItems(await listActiveInterventions(user.uid, 30));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interventions.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    load();
  }, [load]);

  const accept = async (intervention: Intervention) => {
    if (!user?.uid) return;
    await submitRecommendationFeedback({
      recommendationId: intervention.id ?? intervention.title,
      source: 'intervention',
      action: 'accepted',
      recommendationType: intervention.type,
      context: {
        severity: intervention.severity,
        sourceSignals: intervention.sourceSignals,
      },
    });
    await createTaskFromIntervention(intervention, user.uid);
    await load();
  };

  const ignore = async (intervention: Intervention) => {
    if (!intervention.id) return;
    await submitRecommendationFeedback({
      recommendationId: intervention.id,
      source: 'intervention',
      action: 'dismissed',
      recommendationType: intervention.type,
      context: { severity: intervention.severity },
    });
    await ignoreIntervention(intervention.id);
    await load();
  };

  const complete = async (intervention: Intervention) => {
    if (!intervention.id) return;
    await submitRecommendationFeedback({
      recommendationId: intervention.id,
      source: 'intervention',
      action: 'completed',
      recommendationType: intervention.type,
      outcome: 'success',
      rating: 5,
      context: { severity: intervention.severity },
    });
    await completeIntervention(intervention.id);
    await load();
  };

  if (isLoading) return <LoadingState title="Loading interventions" />;

  return (
    <ScreenContainer
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={ALTASAI_COLORS.accent.bright}
            colors={[ALTASAI_COLORS.accent.bright]}
          />
        ),
      }}
    >
      <AppHeader
        eyebrow="Interventions"
        title="Proactive action cards"
        subtitle="AltasAI-generated risk responses you can accept, ignore, or complete."
        showBack
      />

      {error ? <ErrorState title="Interventions unavailable" message={error} actionLabel="Retry" onAction={load} /> : null}

      <View style={styles.stack}>
        {items.length ? items.map((item) => (
          <InterventionCard
            key={item.id}
            intervention={item}
            onAccept={() => accept(item)}
            onIgnore={item.id ? () => ignore(item) : undefined}
            onComplete={item.id ? () => complete(item) : undefined}
          />
        )) : (
          <EmptyState
            title="No active interventions"
            message="AltasAI will create cards when deterministic rules detect execution, finance, health, digital, or security risk."
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: ALTASAI_SPACING.md,
  },
});
