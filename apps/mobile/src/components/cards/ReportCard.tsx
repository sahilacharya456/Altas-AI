import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { AltasAIReport } from '../../types/firestore';
import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';
import { MetricPill } from '../feedback/MetricPill';
import { ActionCard } from './ActionCard';

interface ReportCardProps {
  report: AltasAIReport;
  onPress?: () => void;
}

export const ReportCard = ({ report, onPress }: ReportCardProps) => (
  <ActionCard
    title={report.title}
    subtitle={report.summary}
    meta={report.aiGenerated ? 'AI' : 'DET'}
    onPress={onPress}
  />
);

export const ReportSummary = ({ report }: { report: AltasAIReport }) => (
  <View style={styles.metrics}>
    <MetricPill label="discipline" value={`${report.metrics.disciplineScore}%`} tone="info" />
    <MetricPill label="execution" value={`${report.metrics.executionRate}%`} tone={report.metrics.executionRate >= 70 ? 'success' : 'warning'} />
    <MetricPill label="focus" value={`${report.metrics.focusMinutes}m`} tone="neutral" />
  </View>
);

const styles = StyleSheet.create({
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ALTASAI_SPACING.sm,
  },
  hidden: {
    color: ALTASAI_COLORS.text.muted,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
  },
});
