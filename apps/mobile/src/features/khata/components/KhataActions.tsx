import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { styles } from './khataStyles';

interface KhataActionsProps {
  onAddExpense: () => void;
  onViewHistory: () => void;
  onViewInsights: () => void;
}

export function KhataActions({
  onAddExpense,
  onViewHistory,
  onViewInsights,
}: KhataActionsProps) {
  return (
    <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.actionRow}>
      <Pressable style={styles.primaryButton} onPress={onAddExpense}>
        <Text style={styles.primaryButtonText}>Add Expense</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={onViewHistory}>
        <Text style={styles.secondaryButtonText}>History</Text>
      </Pressable>
      <Pressable style={styles.secondaryButton} onPress={onViewInsights}>
        <Text style={styles.secondaryButtonText}>Insight</Text>
      </Pressable>
    </Animated.View>
  );
}
