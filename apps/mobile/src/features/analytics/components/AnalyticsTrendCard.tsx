import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';

import { GlassCard } from '../../../components/ui';
import { theme } from '../../../theme';
import type { AnalyticsRange, AnalyticsWeeklyStats, TrendChartProps } from '../types';
import { CHART_HEIGHT, CHART_WIDTH, styles } from './analyticsStyles';

const SvgAny = Svg as React.ComponentType<any>;
const PathAny = Path as React.ComponentType<any>;
const DefsAny = Defs as React.ComponentType<any>;
const LinearGradientAny = LinearGradient as React.ComponentType<any>;
const StopAny = Stop as React.ComponentType<any>;
const LineAny = Line as React.ComponentType<any>;
const CircleAny = Circle as React.ComponentType<any>;

interface AnalyticsTrendCardProps {
  range: AnalyticsRange;
  weeklyStats: AnalyticsWeeklyStats;
  chartProgress: TrendChartProps['progress'];
}

export function AnalyticsTrendCard({
  range,
  weeklyStats,
  chartProgress,
}: AnalyticsTrendCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(400).duration(600)}>
      <Text style={styles.sectionTitle}>{range} Trend</Text>
      <GlassCard style={styles.chartCard}>
        <WeeklyChart data={weeklyStats.scores} progress={chartProgress} />
        <View style={styles.chartLegend}>
          {weeklyStats.dates.map((day, index) => (
            <Text key={`${day}-${index}`} style={styles.chartLegendText}>
              {day}
            </Text>
          ))}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

function WeeklyChart({ data }: TrendChartProps) {
  const safeData = data.length ? data : [50];
  const maxValue = Math.max(...safeData, 100);
  const minValue = 0;
  const range = maxValue - minValue || 100;

  const points = safeData.map((rawValue, index) => {
    const value = Number.isFinite(rawValue) ? rawValue : 50;
    const xStep = safeData.length > 1 ? CHART_WIDTH / (safeData.length - 1) : CHART_WIDTH;
    const x = index * xStep;
    const normalizedValue = (value - minValue) / range;
    const y = CHART_HEIGHT - normalizedValue * CHART_HEIGHT * 0.8 - 10;

    return { x, y, value };
  });

  const pathD = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  const lastPoint = points[points.length - 1];
  const areaPathD = `${pathD} L ${lastPoint.x} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

  return (
    <View style={styles.chartContainer}>
      <SvgAny width={CHART_WIDTH} height={CHART_HEIGHT}>
        <DefsAny>
          <LinearGradientAny id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <StopAny offset="0" stopColor={theme.colors.primary.light} stopOpacity="0.4" />
            <StopAny offset="1" stopColor={theme.colors.primary.DEFAULT} stopOpacity="0" />
          </LinearGradientAny>
          <LinearGradientAny id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <StopAny offset="0" stopColor={theme.colors.primary.light} />
            <StopAny offset="1" stopColor={theme.colors.accent.DEFAULT} />
          </LinearGradientAny>
        </DefsAny>

        {[0, 1, 2, 3].map((lineIndex) => (
          <LineAny
            key={lineIndex}
            x1={0}
            y1={(lineIndex / 3) * CHART_HEIGHT}
            x2={CHART_WIDTH}
            y2={(lineIndex / 3) * CHART_HEIGHT}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={1}
          />
        ))}

        <PathAny d={areaPathD} fill="url(#chartGradient)" />
        <PathAny
          d={pathD}
          stroke="url(#lineGradient)"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.length <= 7
          ? points.map((point, index) => (
              <CircleAny
                key={index}
                cx={point.x}
                cy={point.y}
                r={4}
                fill={theme.colors.background.primary}
                stroke={theme.colors.accent.DEFAULT}
                strokeWidth={2}
              />
            ))
          : null}
      </SvgAny>

      <View style={styles.chartLabels}>
        <Text style={styles.chartMaxLabel}>{Math.round(maxValue)}</Text>
        <Text style={styles.chartMinLabel}>{Math.round(minValue)}</Text>
      </View>
    </View>
  );
}
