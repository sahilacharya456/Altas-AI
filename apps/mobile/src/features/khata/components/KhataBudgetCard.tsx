import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '../../../components/ui';
import { ALTASAI_COLORS } from '../../../theme/colors';
import type { MonthlyBudget } from '../../../types/firestore';
import { formatCurrency } from '../constants';
import { styles } from './khataStyles';

interface KhataBudgetStatus {
  percentSpent: number;
  remaining: number;
  isOverBudget: boolean;
  daysInMonth: number;
  daysPassed: number;
  expectedSpendPercent: number;
  pace: 'under' | 'on-track' | 'over';
}

interface KhataBudgetCardProps {
  budget: MonthlyBudget;
  budgetStatus: KhataBudgetStatus;
  financeDisciplineScore: number;
  paceColor: string;
  percentSpent: number;
  financeInsight: string;
}

export function KhataBudgetCard({
  budget,
  budgetStatus,
  financeDisciplineScore,
  paceColor,
  percentSpent,
  financeInsight,
}: KhataBudgetCardProps) {
  const scoreColor =
    financeDisciplineScore >= 75
      ? ALTASAI_COLORS.success.primary
      : financeDisciplineScore >= 50
        ? ALTASAI_COLORS.warning.primary
        : ALTASAI_COLORS.error.primary;

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(500)}>
      <GlassCard style={styles.budgetCard}>
        <Text style={styles.cardTitle}>Financial Discipline Coach</Text>
        <View style={styles.scoreRow}>
          <View>
            <Text style={styles.scoreLabel}>Finance discipline</Text>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>
              {financeDisciplineScore}/100
            </Text>
          </View>
          <Text style={[styles.paceText, { color: paceColor }]}>
            {budgetStatus.pace === 'over'
              ? 'Risk'
              : budgetStatus.pace === 'under'
                ? 'Strong'
                : 'Stable'}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.spentAmount}>{formatCurrency(budget.spent)}</Text>
          <Text style={styles.totalAmount}>/ {formatCurrency(budget.totalBudget)}</Text>
        </View>

        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${percentSpent}%`, backgroundColor: paceColor },
            ]}
          />
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            Day {budgetStatus.daysPassed}/{budgetStatus.daysInMonth}
          </Text>
          <Text style={[styles.paceText, { color: paceColor }]}>
            {budgetStatus.pace === 'over'
              ? 'Over Pace'
              : budgetStatus.pace === 'under'
                ? 'Under Budget'
                : 'On Track'}
          </Text>
        </View>

        <Text style={styles.remainingText}>
          Remaining: {formatCurrency(Math.max(0, budgetStatus.remaining))}
        </Text>
        <View style={styles.signalBox}>
          <Text style={styles.signalTitle}>Cortex signal</Text>
          <Text style={styles.signalText}>{financeInsight}</Text>
        </View>
      </GlassCard>
    </Animated.View>
  );
}
