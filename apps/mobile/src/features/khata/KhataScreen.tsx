import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, GradientBackground, LoadingState } from '../../components/ui';
import {
  KhataActions,
  KhataBudgetCard,
  KhataCategoryCard,
  KhataHeader,
  KhataReminderCard,
} from './components';
import { styles } from './components/khataStyles';
import { useKhata } from './hooks/useKhata';

export default function KhataScreen() {
  const {
    budget,
    budgetStatus,
    khataBalance,
    overdueEntries,
    isLoading,
    error,
    paceColor,
    percentSpent,
    financeDisciplineScore,
    financeInsight,
    retry,
    handleAddExpense,
    handleViewLedger,
    handleViewHistory,
    handleViewInsights,
  } = useKhata();

  return (
    <GradientBackground variant="mesh">
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {isLoading ? (
            <LoadingState
              title="Loading Smart Khata"
              message="AltasAI is reading your finance signals."
              style={styles.loadingPanel}
            />
          ) : error ? (
            <View style={styles.loadingPanel}>
              <ErrorState
                title="Smart Khata unavailable"
                message={error}
                actionLabel="Retry"
                onAction={retry}
              />
            </View>
          ) : !budget || !budgetStatus ? (
            <View style={styles.emptyStatePanel}>
              <Text style={styles.title}>Smart Khata</Text>
              <EmptyState
                title="Budget data is not available"
                message="Create your first expense to initialize this month's financial dashboard."
                actionLabel="Add First Expense"
                onAction={handleAddExpense}
              />
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <KhataHeader />
              <KhataBudgetCard
                budget={budget}
                budgetStatus={budgetStatus}
                financeDisciplineScore={financeDisciplineScore}
                paceColor={paceColor}
                percentSpent={percentSpent}
                financeInsight={financeInsight}
              />
              <KhataCategoryCard budget={budget} />
              <KhataReminderCard
                balance={khataBalance}
                overdueEntries={overdueEntries}
                onViewLedger={handleViewLedger}
              />
              <KhataActions
                onAddExpense={handleAddExpense}
                onViewHistory={handleViewHistory}
                onViewInsights={handleViewInsights}
              />
              <View style={styles.bottomSpacer} />
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </GradientBackground>
  );
}
