import React from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';

import { ALTASAI_COLORS, ALTASAI_RADIUS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';
import type { ReportChartPoint } from '../../types/firestore';

interface MetricBarChartProps {
  title: string;
  data: ReportChartPoint[];
  maxValue?: number;
  suffix?: string;
}

export const MetricBarChart = ({ title, data, maxValue, suffix = '' }: MetricBarChartProps) => {
  const calculatedMax = maxValue ?? Math.max(1, ...data.flatMap((point) => [point.value, point.secondaryValue ?? 0]));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chart}>
        {data.map((point, index) => {
          const height = `${Math.max(6, (point.value / calculatedMax) * 100)}%` as DimensionValue;
          const secondaryHeight = point.secondaryValue !== undefined
            ? `${Math.max(6, (point.secondaryValue / calculatedMax) * 100)}%` as DimensionValue
            : undefined;

          return (
            <View key={`${point.label}-${index}`} style={styles.column}>
              <View style={styles.barTrack}>
                {secondaryHeight ? <View style={[styles.bar, styles.secondaryBar, { height: secondaryHeight }]} /> : null}
                <View style={[styles.bar, { height }]} />
              </View>
              <Text style={styles.label}>{point.label}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.footer}>
        Latest: {data[data.length - 1]?.value ?? 0}{suffix}
        {data[data.length - 1]?.secondaryValue !== undefined ? ` / ${data[data.length - 1]?.secondaryValue}${suffix}` : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    borderRadius: ALTASAI_RADIUS.lg,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
    padding: ALTASAI_SPACING.md,
    gap: ALTASAI_SPACING.sm,
  },
  title: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  chart: {
    height: 104,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: ALTASAI_SPACING.xs,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: ALTASAI_SPACING.xs,
  },
  barTrack: {
    width: '100%',
    height: 78,
    justifyContent: 'flex-end',
    borderRadius: ALTASAI_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: ALTASAI_COLORS.background.tertiary,
  },
  bar: {
    width: '100%',
    minHeight: 6,
    borderTopLeftRadius: ALTASAI_RADIUS.md,
    borderTopRightRadius: ALTASAI_RADIUS.md,
    backgroundColor: ALTASAI_COLORS.accent.bright,
  },
  secondaryBar: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '44%',
    backgroundColor: ALTASAI_COLORS.accent.violet,
    zIndex: 2,
  },
  label: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
  },
  footer: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
  },
});
