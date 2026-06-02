import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ActionCard, CommandCard, StatCard } from '../../src/components/cards';
import { GradientButton, SectionHeader } from '../../src/components/common';
import { EmptyState, ErrorState, LoadingState } from '../../src/components/feedback';
import { AppHeader, ScreenContainer } from '../../src/components/layout';
import { ROUTES } from '../../src/constants/routes';
import { generateDailyReport, generateMonthlyReportPlaceholder, generateStoredWeeklyReport } from '../../src/services/ai';
import { listReports } from '../../src/services/data';
import { useAuthStore } from '../../src/stores/authStore';
import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../src/theme';
import type { AltasAIReport } from '../../src/types/firestore';

const formatDate = (report: AltasAIReport) => {
  const date = report.generatedAt && typeof report.generatedAt === 'object' && 'toDate' in report.generatedAt
    ? report.generatedAt.toDate()
    : new Date();
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function ReportsScreen() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<AltasAIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      setReports(await listReports(user.uid, 30));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const generate = async (type: 'daily' | 'weekly' | 'monthly') => {
    setGenerating(type);
    setError(null);
    try {
      let result: unknown = null;
      if (type === 'daily') result = await generateDailyReport();
      if (type === 'weekly') result = await generateStoredWeeklyReport('Generate the weekly AltasAI performance report.');
      if (type === 'monthly') result = await generateMonthlyReportPlaceholder();
      if (!result) {
        setError('Report generation failed. Check your connection and try again.');
      }
      await loadReports();
    } catch (genError) {
      setError(genError instanceof Error ? genError.message : 'Report generation failed.');
    } finally {
      setGenerating(null);
    }
  };

  const openReport = (report: AltasAIReport) => {
    const route = report.type === 'daily' ? ROUTES.MAIN.DAILY_REPORT : ROUTES.MAIN.WEEKLY_REPORT;
    router.push({ pathname: route, params: { reportId: report.id } } as any);
  };

  if (loading) {
    return <LoadingState title="Loading reports" />;
  }

  return (
    <ScreenContainer
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={loading}
            onRefresh={loadReports}
            tintColor={ALTASAI_COLORS.accent.bright}
            colors={[ALTASAI_COLORS.accent.bright]}
          />
        ),
      }}
    >
      <AppHeader
        eyebrow="Reports and analytics"
        title="AltasAI intelligence reports"
        subtitle="Daily command briefings, weekly performance reports, and the prepared monthly report structure."
      />

      {error ? <ErrorState title="Reports did not load" message={error} actionLabel="Retry" onAction={loadReports} /> : null}

      <CommandCard eyebrow="Generate" title="Create a fresh report">
        <View style={styles.generateGrid}>
          <GradientButton title="Daily briefing" loading={generating === 'daily'} disabled={Boolean(generating)} onPress={() => generate('daily')} />
          <GradientButton title="Weekly report" loading={generating === 'weekly'} disabled={Boolean(generating)} onPress={() => generate('weekly')} />
          <GradientButton title="Monthly placeholder" variant="secondary" loading={generating === 'monthly'} disabled={Boolean(generating)} onPress={() => generate('monthly')} />
        </View>
      </CommandCard>

      <View style={styles.metricGrid}>
        <StatCard label="Reports" value={String(reports.length)} helper="Stored in Firestore" tone="info" style={styles.metricCard} />
        <StatCard label="Latest" value={reports[0]?.type ?? 'none'} helper={reports[0] ? formatDate(reports[0]) : 'Generate one'} tone="success" style={styles.metricCard} />
      </View>

      <SectionHeader title="Report history" subtitle="Server-written reports from AltasAI signal data." />
      <View style={styles.reportList}>
        {reports.length ? (
          reports.map((report) => (
            <ActionCard
              key={report.id}
              title={report.title}
              subtitle={`${report.type.toUpperCase()} - ${formatDate(report)} - execution ${report.metrics.executionRate}%`}
              meta={report.aiGenerated ? 'AI' : 'DET'}
              onPress={() => openReport(report)}
            />
          ))
        ) : (
          <EmptyState
            title="No reports yet"
            message="Generate a daily briefing or weekly report to create the first intelligence artifact."
            actionLabel="Generate daily"
            onAction={() => generate('daily')}
          />
        )}
      </View>

      <Text style={styles.exportNote} onPress={() => Alert.alert('Export placeholder', 'PDF export is reserved for a later phase.')}>
        Export is intentionally placeholder-only in Phase 9.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  generateGrid: {
    gap: ALTASAI_SPACING.sm,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: ALTASAI_SPACING.sm,
  },
  metricCard: {
    flex: 1,
  },
  reportList: {
    gap: ALTASAI_SPACING.sm,
  },
  exportNote: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    textAlign: 'center',
  },
});
