import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CommandCard, InsightCard, StatCard } from '../../components/cards';
import { GradientButton, SectionHeader } from '../../components/common';
import { MetricBarChart } from '../../components/charts';
import { RiskBadge } from '../../components/feedback';
import { AppHeader, ScreenContainer } from '../../components/layout';
import { ALTASAI_COLORS, ALTASAI_RADIUS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';
import type { AltasAIReport } from '../../types/firestore';

interface ReportDetailViewProps {
  report: AltasAIReport;
  onExport: () => void;
}

const formatDate = (value: AltasAIReport['generatedAt']): string => {
  const date = value && typeof value === 'object' && 'toDate' in value ? value.toDate() : new Date();
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const riskFromRate = (executionRate: number) => {
  if (executionRate < 30) return 'critical';
  if (executionRate < 50) return 'high';
  if (executionRate < 75) return 'medium';
  return 'low';
};

export const ReportDetailView = ({ report, onExport }: ReportDetailViewProps) => (
  <ScreenContainer>
    <AppHeader
      eyebrow={`${report.type.toUpperCase()} REPORT - ${formatDate(report.generatedAt)}`}
      title={report.title}
      subtitle={report.summary}
      right={<RiskBadge level={riskFromRate(report.metrics.executionRate)} />}
    />

    <View style={styles.metricGrid}>
      <StatCard label="Discipline" value={`${report.metrics.disciplineScore}%`} helper="Current score" tone="info" style={styles.metricCard} />
      <StatCard label="Execution" value={`${report.metrics.executionRate}%`} helper="Completed vs missed/carried" tone={report.metrics.executionRate >= 70 ? 'success' : 'warning'} style={styles.metricCard} />
      <StatCard label="Focus" value={`${report.metrics.focusMinutes}m`} helper="Logged focus time" tone="success" style={styles.metricCard} />
      <StatCard label="Reflection" value={`${report.metrics.reflectionConsistency}%`} helper="Consistency" tone={report.metrics.reflectionConsistency >= 70 ? 'success' : 'warning'} style={styles.metricCard} />
    </View>

    <CommandCard eyebrow="Command briefing" title="What matters now">
      <View style={styles.sectionBlock}>
        <Text style={styles.label}>Top priorities</Text>
        {report.priorities.slice(0, 3).map((priority, index) => (
          <Text key={`${priority}-${index}`} style={styles.itemText}>{index + 1}. {priority}</Text>
        ))}
        <Text style={styles.label}>Focus window</Text>
        <Text style={styles.bodyText}>{report.recommendedFocusWindow}</Text>
        <Text style={styles.label}>Strict mentor message</Text>
        <Text style={styles.bodyText}>{report.strictMentorMessage}</Text>
      </View>
    </CommandCard>

    <InsightCard
      eyebrow="Biggest weakness"
      title={report.biggestWeakness}
      body={report.riskReasons.join(' ')}
      risk={riskFromRate(report.metrics.executionRate)}
    />

    <InsightCard
      eyebrow="Biggest win"
      title={report.biggestWin}
      body={report.nextPlan.join(' ')}
    />

    {report.warnings.length ? (
      <CommandCard eyebrow="Cross-domain warnings" title="Finance, health, digital, and security">
        <View style={styles.sectionBlock}>
          {report.warnings.map((warning, index) => (
            <Text key={`${warning}-${index}`} style={styles.warningText}>{warning}</Text>
          ))}
        </View>
      </CommandCard>
    ) : null}

    <SectionHeader title="Charts" subtitle="Simple deterministic report trends." />
    <View style={styles.chartGrid}>
      <MetricBarChart title="Execution rate" data={report.charts.executionRate} maxValue={100} suffix="%" />
      <MetricBarChart title="Discipline score" data={report.charts.disciplineScore} maxValue={100} suffix="%" />
      <MetricBarChart title="Focus minutes" data={report.charts.focusMinutes} />
      <MetricBarChart title="Carried tasks" data={report.charts.carriedTasks} />
      <MetricBarChart title="Mood / energy" data={report.charts.moodEnergy} maxValue={5} />
    </View>

    <SectionHeader title="Report sections" subtitle="Generated from AltasAI execution signals." />
    <View style={styles.sectionList}>
      {report.sections.map((section) => (
        <View key={section.title} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.bodyText}>{section.body}</Text>
          {section.items?.map((item, index) => (
            <Text key={`${section.title}-${index}`} style={styles.itemText}>{item}</Text>
          ))}
        </View>
      ))}
    </View>

    <GradientButton title="Export report" variant="secondary" onPress={onExport} fullWidth />
    <Text style={styles.exportNote}>PDF export is prepared as a product placeholder and is not implemented in Phase 9.</Text>
  </ScreenContainer>
);

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ALTASAI_SPACING.sm,
  },
  metricCard: {
    width: '48%',
  },
  sectionBlock: {
    gap: ALTASAI_SPACING.sm,
  },
  label: {
    color: ALTASAI_COLORS.accent.bright,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    textTransform: 'uppercase',
  },
  bodyText: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
  },
  itemText: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
  },
  warningText: {
    color: ALTASAI_COLORS.warning.light,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
  },
  chartGrid: {
    gap: ALTASAI_SPACING.sm,
  },
  sectionList: {
    gap: ALTASAI_SPACING.sm,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    borderRadius: ALTASAI_RADIUS.lg,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
    padding: ALTASAI_SPACING.md,
    gap: ALTASAI_SPACING.xs,
  },
  sectionTitle: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
  },
  exportNote: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    textAlign: 'center',
  },
});
