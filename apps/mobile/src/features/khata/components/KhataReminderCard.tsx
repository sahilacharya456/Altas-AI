import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GlassCard } from '../../../components/ui';
import type { KhataEntry } from '../../../types/firestore';
import { formatCurrency } from '../constants';
import { styles } from './khataStyles';

interface KhataBalance {
  youOwe: number;
  owedToYou: number;
  netBalance: number;
}

interface KhataReminderCardProps {
  balance: KhataBalance;
  overdueEntries: KhataEntry[];
  onViewLedger: () => void;
}

export function KhataReminderCard({
  balance,
  overdueEntries,
  onViewLedger,
}: KhataReminderCardProps) {
  return (
    <Animated.View entering={FadeInDown.delay(300).duration(500)}>
      <GlassCard style={styles.khataCard}>
        <Text style={styles.cardTitle}>Khata Reminders</Text>

        <View style={styles.khataGrid}>
          <View style={styles.khataItem}>
            <Text style={styles.khataLabel}>You Owe</Text>
            <Text style={[styles.khataAmount, styles.debtColor]}>
              {formatCurrency(balance.youOwe)}
            </Text>
          </View>

          <View style={styles.khataItem}>
            <Text style={styles.khataLabel}>Owed to You</Text>
            <Text style={[styles.khataAmount, styles.creditColor]}>
              {formatCurrency(balance.owedToYou)}
            </Text>
          </View>

          <View style={styles.khataItem}>
            <Text style={styles.khataLabel}>Net</Text>
            <Text
              style={[
                styles.khataAmount,
                balance.netBalance < 0 ? styles.debtColor : styles.creditColor,
              ]}
            >
              {formatCurrency(Math.abs(balance.netBalance))}
            </Text>
          </View>
        </View>

        <Pressable style={styles.ledgerButton} onPress={onViewLedger}>
          <Text style={styles.ledgerButtonText}>View Ledger -&gt;</Text>
        </Pressable>
        {overdueEntries.length > 0 ? (
          <Text style={styles.warningText}>
            {overdueEntries.length} repayment reminder
            {overdueEntries.length === 1 ? '' : 's'} overdue. AltasAI emits this as finance risk.
          </Text>
        ) : null}
      </GlassCard>
    </Animated.View>
  );
}
