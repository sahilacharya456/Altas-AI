import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState, GradientBackground, LoadingState } from '../../components/ui';
import {
  AnalyticsHeader,
  AnalyticsInsightsCard,
  AnalyticsScoreCard,
  AnalyticsStatsGrid,
  AnalyticsTrendCard,
} from './components';
import { styles } from './components/analyticsStyles';
import { useAnalytics } from './hooks/useAnalytics';

export default function AnalyticsScreen() {
  const {
    selectedRange,
    setSelectedRange,
    ranges,
    dashboard,
    weeklyStats,
    insights,
    disciplineScore,
    chartProgress,
    isLoading,
    error,
    retry,
  } = useAnalytics();

  return (
    <GradientBackground variant="mesh">
      <SafeAreaView style={styles.container}>
        <AnalyticsHeader
          ranges={ranges}
          selectedRange={selectedRange}
          onRangeChange={setSelectedRange}
        />

        {isLoading && !dashboard ? (
          <LoadingState
            title="Loading analytics"
            message="AltasAI is building the latest performance view."
            style={styles.loadingPanel}
          />
        ) : error && !dashboard ? (
          <View style={styles.loadingPanel}>
            <ErrorState
              title="Analytics unavailable"
              message={error}
              actionLabel="Retry"
              onAction={retry}
            />
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <AnalyticsScoreCard
              dashboard={dashboard}
              disciplineScore={disciplineScore}
              weeklyStats={weeklyStats}
            />
            <AnalyticsTrendCard
              range={selectedRange}
              weeklyStats={weeklyStats}
              chartProgress={chartProgress}
            />
            <AnalyticsStatsGrid
              dashboard={dashboard}
              range={selectedRange}
              weeklyStats={weeklyStats}
            />
            <AnalyticsInsightsCard insights={insights} />
            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}
