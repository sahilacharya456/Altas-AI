import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { safeImpactAsync, safeNotificationAsync, ImpactFeedbackStyle, NotificationFeedbackType } from '../../src/utils/haptics';
import { GradientBackground, GlassCard } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/authStore';
import { getCurrentMonthExpenses, deleteExpense, subtractExpenseFromBudget } from '../../src/services/data';
import type { Expense, ExpenseCategory } from '../../src/types/firestore';
import { ALTASAI_COLORS } from '../../src/theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../src/theme/typography';
import { ALTASAI_SPACING } from '../../src/theme/spacing';
import { convertToDate } from '../../src/utils/dateUtils';
const theme = { colors: ALTASAI_COLORS, typography: ALTASAI_TYPOGRAPHY, spacing: ALTASAI_SPACING };

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
    food: 'FOOD',
    transport: 'TRVL',
    study: 'STDY',
    rent: 'RENT',
    entertainment: 'PLAY',
    misc: 'MISC',
};

const formatDate = (timestamp: any): string => {
    const date = convertToDate(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    }
};

const formatTime = (timestamp: any): string => {
    return convertToDate(timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const groupExpensesByDate = (expenses: Expense[]): Map<string, Expense[]> => {
    const grouped = new Map<string, Expense[]>();

    expenses.forEach(expense => {
        const dateKey = formatDate(expense.date);
        const existing = grouped.get(dateKey) || [];
        grouped.set(dateKey, [...existing, expense]);
    });

    return grouped;
};

export default function ExpenseHistoryScreen() {
    const { user } = useAuthStore();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (user?.uid) {
            loadExpenses();
        } else {
            setIsLoading(false);
        }
    }, [user?.uid]);

    const loadExpenses = async () => {
        if (!user?.uid) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const data = await getCurrentMonthExpenses(user.uid);
            setExpenses(data);
        } catch (error) {
            console.error('Error loading expenses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (expense: Expense) => {
        if (!user?.uid) return;

        setDeletingId(expense.id);
        safeImpactAsync(ImpactFeedbackStyle.Medium);

        try {
            await deleteExpense(expense.id);
            await subtractExpenseFromBudget(user.uid, expense.amount, expense.category);

            setExpenses(prev => prev.filter(e => e.id !== expense.id));
            safeNotificationAsync(NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Error deleting expense:', error);
            safeNotificationAsync(NotificationFeedbackType.Error);
        } finally {
            setDeletingId(null);
        }
    };

    const groupedExpenses = groupExpensesByDate(expenses);
    const monthTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

    if (isLoading) {
        return (
            <GradientBackground variant="mesh">
                <SafeAreaView style={styles.container}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </SafeAreaView>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground variant="mesh">
            <SafeAreaView style={styles.container}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
                        <Pressable onPress={() => router.back()} style={styles.backButton}>
                            <Text style={styles.backText}>Back</Text>
                        </Pressable>
                        <Text style={styles.title}>Expense History</Text>
                        <Text style={styles.subtitle}>
                            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                        </Text>
                    </Animated.View>

                    {/* Month Summary */}
                    <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                        <GlassCard style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>This Month</Text>
                            <Text style={styles.summaryAmount}>Rs {monthTotal.toLocaleString()}</Text>
                            <Text style={styles.summaryCount}>{expenses.length} expenses logged</Text>
                        </GlassCard>
                    </Animated.View>

                    {/* Expenses by Date */}
                    {groupedExpenses.size === 0 ? (
                        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                            <GlassCard style={styles.emptyCard}>
                                <Text style={styles.emptyIcon}>EMPTY</Text>
                                <Text style={styles.emptyText}>No expenses yet this month</Text>
                                <Text style={styles.emptySubtext}>Tap + to add your first expense</Text>
                            </GlassCard>
                        </Animated.View>
                    ) : (
                        Array.from(groupedExpenses.entries()).map(([dateLabel, dateExpenses], index) => (
                            <Animated.View
                                key={dateLabel}
                                entering={FadeInDown.delay(200 + index * 50).duration(600)}
                            >
                                <View style={styles.dateSection}>
                                    <Text style={styles.dateLabel}>{dateLabel}</Text>
                                    <View style={styles.dateExpenses}>
                                        {dateExpenses.map((expense) => (
                                            <GlassCard key={expense.id} style={styles.expenseCard}>
                                                <View style={styles.expenseRow}>
                                                    <Text style={styles.expenseIcon}>
                                                        {CATEGORY_ICONS[expense.category]}
                                                    </Text>
                                                    <View style={styles.expenseInfo}>
                                                        <Text style={styles.expenseCategory}>
                                                            {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                                                        </Text>
                                                        {expense.note && (
                                                            <Text style={styles.expenseNote}>{expense.note}</Text>
                                                        )}
                                                        <Text style={styles.expenseTime}>{formatTime(expense.date)}</Text>
                                                    </View>
                                                    <View style={styles.expenseRight}>
                                                        <Text style={styles.expenseAmount}>
                                                            Rs {expense.amount.toLocaleString()}
                                                        </Text>
                                                        <Pressable
                                                            style={styles.deleteButton}
                                                            onPress={() => handleDelete(expense)}
                                                            disabled={deletingId === expense.id}
                                                        >
                                                            <Text style={styles.deleteText}>
                                                                {deletingId === expense.id ? '...' : 'Delete'}
                                                            </Text>
                                                        </Pressable>
                                                    </View>
                                                </View>
                                            </GlassCard>
                                        ))}
                                    </View>
                                </View>
                            </Animated.View>
                        ))
                    )}

                    <View style={styles.bottomSpacer} />
                </ScrollView>
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20 },
    loadingText: { fontSize: 16, color: theme.colors.text.secondary, textAlign: 'center', marginTop: 100 },
    header: { paddingTop: 20, paddingBottom: 24 },
    backButton: { marginBottom: 16 },
    backText: { fontSize: 16, color: theme.colors.primary.DEFAULT, fontWeight: '600' },
    title: { fontSize: 32, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
    subtitle: { fontSize: 16, color: theme.colors.text.tertiary },
    summaryCard: { padding: 24, marginBottom: 24, alignItems: 'center' },
    summaryLabel: { fontSize: 12, color: theme.colors.text.tertiary, textTransform: 'uppercase', marginBottom: 8 },
    summaryAmount: { fontSize: 40, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
    summaryCount: { fontSize: 14, color: theme.colors.text.secondary },
    emptyCard: { padding: 40, alignItems: 'center' },
    emptyIcon: { fontSize: 12, fontWeight: '800', letterSpacing: 0, color: theme.colors.primary.DEFAULT, marginBottom: 16 },
    emptyText: { fontSize: 18, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: theme.colors.text.tertiary },
    dateSection: { marginBottom: 24 },
    dateLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text.secondary, marginBottom: 12, textTransform: 'uppercase' },
    dateExpenses: { gap: 12 },
    expenseCard: { padding: 16 },
    expenseRow: { flexDirection: 'row', alignItems: 'center' },
    expenseIcon: { width: 44, marginRight: 12, fontSize: 11, fontWeight: '800', color: theme.colors.primary.DEFAULT, textAlign: 'center' },
    expenseInfo: { flex: 1 },
    expenseCategory: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 2 },
    expenseNote: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: 4 },
    expenseTime: { fontSize: 12, color: theme.colors.text.tertiary },
    expenseRight: { alignItems: 'flex-end' },
    expenseAmount: { fontSize: 20, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
    deleteButton: { padding: 4 },
    deleteText: { fontSize: 16 },
    bottomSpacer: { height: 40 },
});
