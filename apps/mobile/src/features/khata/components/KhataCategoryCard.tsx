import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '../../../components/ui';
import { ALTASAI_COLORS } from '../../../theme/colors';
import type { ExpenseCategory, MonthlyBudget } from '../../../types/firestore';
import { CATEGORY_BADGES, formatCategoryName, formatCurrency } from '../constants';
import { styles } from './khataStyles';

interface KhataCategoryCardProps {
  budget: MonthlyBudget;
}

export function KhataCategoryCard({ budget }: KhataCategoryCardProps) {
  const categories = Object.entries(budget.categorySpent)
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) as [ExpenseCategory, number][];

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(500)}>
      <GlassCard style={styles.categoryCard}>
        <Text style={styles.cardTitle}>Categories</Text>

        {categories.map(([category, amount]) => {
          const limit = category === 'misc' ? undefined : budget.categoryLimits?.[category];
          const percent = limit ? Math.min((amount / limit) * 100, 100) : 0;

          return (
            <View key={category} style={styles.categoryRow}>
              <Text style={styles.categoryIcon}>{CATEGORY_BADGES[category]}</Text>
              <View style={styles.categoryInfo}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{formatCategoryName(category)}</Text>
                  <Text style={styles.categoryAmount}>
                    {formatCurrency(amount)}
                    {limit ? (
                      <Text style={styles.categoryLimit}> / {formatCurrency(limit)}</Text>
                    ) : null}
                  </Text>
                </View>
                {limit ? (
                  <View style={styles.categoryProgressContainer}>
                    <View
                      style={[
                        styles.categoryProgress,
                        {
                          width: `${percent}%`,
                          backgroundColor:
                            percent >= 100
                              ? ALTASAI_COLORS.error.primary
                              : ALTASAI_COLORS.accent.primary,
                        },
                      ]}
                    />
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      </GlassCard>
    </Animated.View>
  );
}
