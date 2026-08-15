import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { ScreenContainer, AppHeader } from '../../src/components/layout';
import { CommandCard } from '../../src/components/cards';
import { GradientButton, SectionHeader } from '../../src/components/common';
import { ALTASAI_COLORS, ALTASAI_TYPOGRAPHY } from '../../src/theme';
import { altasaiCardEntrance } from '../../src/utils/animations';
import { ROUTES } from '../../src/constants/routes';

export default function KhataScreen() {
  return (
    <ScreenContainer>
      <Animated.View entering={altasaiCardEntrance(0)}>
        <AppHeader
          eyebrow="Smart Khata"
          title="Borrow & lend tracker"
          subtitle="Track money owed and lent with full accountability."
        />
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(1)}>
        <SectionHeader title="Ledger" subtitle="Full borrow/lend history." />
        <CommandCard eyebrow="Transactions" title="Open ledger">
          <Text style={styles.body}>
            Track every rupee borrowed or lent. Get reminded about pending settlements. Keep your financial relationships clean.
          </Text>
          <GradientButton
            title="View ledger"
            size="sm"
            onPress={() => router.push(ROUTES.MAIN.LEDGER as any)}
          />
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(2)}>
        <SectionHeader title="Expenses" subtitle="Daily spending and budget tracking." />
        <CommandCard eyebrow="Finance" title="Expense history">
          <Text style={styles.body}>
            View and filter all your expenses by category, date, and amount. Identify spending patterns and budget overruns.
          </Text>
          <GradientButton
            title="View expenses"
            size="sm"
            variant="secondary"
            onPress={() => router.push(ROUTES.MAIN.EXPENSE_HISTORY as any)}
          />
        </CommandCard>
      </Animated.View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { color: ALTASAI_COLORS.text.secondary, fontSize: ALTASAI_TYPOGRAPHY.size.sm, lineHeight: ALTASAI_TYPOGRAPHY.size.sm * 1.6, marginBottom: ALTASAI_TYPOGRAPHY.size.sm },
});
