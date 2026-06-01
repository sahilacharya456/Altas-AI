import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';

import { AppHeader, ScreenContainer } from '../../src/components/layout';
import { CommandCard } from '../../src/components/cards';
import { EmptyState, ErrorState, LoadingState, RiskBadge } from '../../src/components/feedback';
import { getRecentCortexEvents } from '../../src/services/data';
import { useAuthStore } from '../../src/stores/authStore';
import {
  ALTASAI_COLORS,
  ALTASAI_RADIUS,
  ALTASAI_SPACING,
  ALTASAI_TYPOGRAPHY,
} from '../../src/theme';
import { convertToDate } from '../../src/utils/dateUtils';
import type { BehaviorEvent } from '../../src/types/firestore';

export default function BehaviorTimelineScreen() {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<BehaviorEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!user?.uid) return;
    try {
      setError(null);
      setEvents(await getRecentCortexEvents(user.uid, 50));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load behavior events.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const grouped = useMemo(() => {
    return events.reduce<Record<string, BehaviorEvent[]>>((acc, event) => {
      const key = convertToDate(event.createdAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
      acc[key] = acc[key] ? [...acc[key], event] : [event];
      return acc;
    }, {});
  }, [events]);

  if (isLoading) return <LoadingState title="Loading behavior timeline" />;

  return (
    <ScreenContainer
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadEvents();
            }}
            tintColor={ALTASAI_COLORS.accent.bright}
            colors={[ALTASAI_COLORS.accent.bright]}
          />
        ),
      }}
    >
      <AppHeader
        eyebrow="Cortex"
        title="Behavior timeline"
        subtitle="Signals grouped by date across execution, reflection, goals, and system modules."
        showBack
      />

      {error ? <ErrorState title="Timeline did not load cleanly" message={error} actionLabel="Retry" onAction={loadEvents} /> : null}

      {Object.keys(grouped).length ? (
        Object.entries(grouped).map(([date, dateEvents]) => (
          <View key={date} style={styles.dayGroup}>
            <Text style={styles.dateLabel}>{date}</Text>
            <View style={styles.eventStack}>
              {dateEvents.map((event) => (
                <CommandCard
                  key={event.id ?? `${event.eventType}-${event.title}-${event.createdAt.toMillis?.()}`}
                  eyebrow={`${event.source} - ${event.eventType}`}
                  title={event.title}
                  right={<RiskBadge level={event.severity} />}
                >
                  <Text style={styles.message}>{event.message}</Text>
                  <View style={styles.sourceBadge}>
                    <Text style={styles.sourceText}>{event.source}</Text>
                  </View>
                </CommandCard>
              ))}
            </View>
          </View>
        ))
      ) : (
        <EmptyState
          title="No behavior events yet"
          message="Cortex will populate this timeline as tasks, goals, reflections, focus sessions, and system modules emit events."
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  dayGroup: {
    gap: ALTASAI_SPACING.sm,
  },
  dateLabel: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.lg,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
  },
  eventStack: {
    gap: ALTASAI_SPACING.sm,
  },
  message: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
  },
  sourceBadge: {
    alignSelf: 'flex-start',
    marginTop: ALTASAI_SPACING.sm,
    borderRadius: ALTASAI_RADIUS.full,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    paddingHorizontal: ALTASAI_SPACING.sm,
    paddingVertical: 4,
  },
  sourceText: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    textTransform: 'uppercase',
  },
});
