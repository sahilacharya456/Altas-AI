import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { EmptyState, ErrorState, LoadingState } from '../../src/components/feedback';
import { ReportDetailView } from '../../src/features/reports/ReportDetailView';
import { generateDailyReport } from '../../src/services/ai';
import { getLatestReport, getReport } from '../../src/services/data';
import { useAuthStore } from '../../src/stores/authStore';
import type { AltasAIReport } from '../../src/types/firestore';

export default function DailyReportScreen() {
  const { reportId } = useLocalSearchParams<{ reportId?: string }>();
  const { user } = useAuthStore();
  const [report, setReport] = useState<AltasAIReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!user?.uid) return;
    setError(null);
    try {
      const loaded = reportId ? await getReport(reportId) : await getLatestReport(user.uid, 'daily');
      setReport(loaded);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load daily report.');
    } finally {
      setLoading(false);
    }
  }, [reportId, user?.uid]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const createReport = async () => {
    setLoading(true);
    const generated = await generateDailyReport();
    setReport(generated);
    setLoading(false);
  };

  if (loading) return <LoadingState title="Loading daily briefing" />;
  if (error) return <ErrorState title="Daily briefing unavailable" message={error} actionLabel="Retry" onAction={loadReport} />;
  if (!report) {
    return (
      <EmptyState
        title="No daily briefing yet"
        message="Generate a deterministic daily command briefing from your current AltasAI signals."
        actionLabel="Generate briefing"
        onAction={createReport}
      />
    );
  }

  return (
    <ReportDetailView
      report={report}
      onExport={() => Alert.alert('Export placeholder', 'Daily briefing export will be implemented in a later phase.')}
    />
  );
}
