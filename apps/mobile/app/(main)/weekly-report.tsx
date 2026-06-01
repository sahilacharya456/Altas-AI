import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { EmptyState, ErrorState, LoadingState } from '../../src/components/feedback';
import { ReportDetailView } from '../../src/features/reports/ReportDetailView';
import { generateStoredWeeklyReport } from '../../src/services/ai';
import { getLatestReport, getReport } from '../../src/services/data';
import { useAuthStore } from '../../src/stores/authStore';
import type { AltasAIReport } from '../../src/types/firestore';

export default function WeeklyReportScreen() {
  const { reportId } = useLocalSearchParams<{ reportId?: string }>();
  const { user } = useAuthStore();
  const [report, setReport] = useState<AltasAIReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      const loaded = reportId ? await getReport(reportId) : await getLatestReport(user.uid, 'weekly');
      setReport(loaded);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load weekly report.');
    } finally {
      setLoading(false);
    }
  }, [reportId, user?.uid]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const createReport = async () => {
    setLoading(true);
    const generated = await generateStoredWeeklyReport('Generate the weekly AltasAI performance report.');
    setReport(generated);
    setLoading(false);
  };

  if (loading) return <LoadingState title="Loading weekly report" />;
  if (error) return <ErrorState title="Weekly report unavailable" message={error} actionLabel="Retry" onAction={loadReport} />;
  if (!report) {
    return (
      <EmptyState
        title="No weekly report yet"
        message="Generate a weekly performance report from task, focus, goal, reflection, and Cortex signals."
        actionLabel="Generate weekly"
        onAction={createReport}
      />
    );
  }

  return (
    <ReportDetailView
      report={report}
      onExport={() => Alert.alert('Export placeholder', 'Weekly report export will be implemented in a later phase.')}
    />
  );
}
