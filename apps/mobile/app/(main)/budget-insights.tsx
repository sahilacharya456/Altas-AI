import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { safeImpactAsync, safeNotificationAsync, ImpactFeedbackStyle, NotificationFeedbackType } from '../../src/utils/haptics';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { GradientBackground, GlassCard, AnimatedButton } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/authStore';
import {
    getCurrentBudget,
    getCurrentMonthExpenses,
    getDailyTotals,
    groupByCategory,
    getAllKhataEntries,
    calculateNetBalance,
} from '../../src/services/data';
import { analyzeBudgetDiscipline } from '../../src/services/ai';
import { ROUTES } from '../../src/constants/routes';
import type { MonthlyBudget, Expense } from '../../src/types/firestore';
import { ALTASAI_COLORS } from '../../src/theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../src/theme/typography';
import { ALTASAI_SPACING } from '../../src/theme/spacing';
const theme = { colors: ALTASAI_COLORS, typography: ALTASAI_TYPOGRAPHY, spacing: ALTASAI_SPACING };

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 40;

const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    color: (opacity = 1) => `rgba(0, 245, 160, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 0,
    propsForLabels: {
        fontSize: 10,
        fontWeight: '600',
    },
};

export default function BudgetInsightsScreen() {
    const { user } = useAuthStore();
    const [budget, setBudget] = useState<MonthlyBudget | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [insights, setInsights] = useState<any[]>([]);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.uid) {
            loadData();
        } else {
            setIsLoading(false);
        }
    }, [user?.uid]);

    const loadData = async () => {
        if (!user?.uid) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const [budgetData, expensesData] = await Promise.all([
                getCurrentBudget(user.uid),
                getCurrentMonthExpenses(user.uid),
            ]);

            setBudget(budgetData);
            setExpenses(expensesData);
        } catch (error) {
            if (__DEV__) console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!user?.uid) return;

        setIsLoadingAI(true);
        safeImpactAsync(ImpactFeedbackStyle.Medium);

        try {
            const data = await analyzeBudgetDiscipline();
            setInsights(data);
            safeNotificationAsync(NotificationFeedbackType.Success);
        } catch (error) {
            if (__DEV__) console.error('Error analyzing budget:', error);
            safeNotificationAsync(NotificationFeedbackType.Error);
        } finally {
            setIsLoadingAI(false);
        }
    };

    if (isLoading) {
        return (
            <GradientBackground variant="mesh">
                <SafeAreaView style={styles.container}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </SafeAreaView>
            </GradientBackground>
        );
    }

    if (!budget) {
        return (
            <GradientBackground variant="mesh">
                <SafeAreaView style={styles.container}>
                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
                            <Pressable onPress={() => router.back()} style={styles.backButton}>
                            <Text style={styles.backText}>Back</Text>
                            </Pressable>
                            <Text style={styles.title}>Budget Insights</Text>
                            <Text style={styles.subtitle}>AI-powered analysis</Text>
                        </Animated.View>

                        <GlassCard style={styles.emptyStatePanel}>
                            <Text style={styles.emptyStateTitle}>Budget data is not available</Text>
                            <Text style={styles.emptyStateText}>
                                Create a monthly budget or add your first expense to unlock spending charts and AI analysis.
                            </Text>
                            <AnimatedButton
                                title="Open Smart Khata"
                                variant="primary"
                                size="lg"
                                fullWidth
                                onPress={() => router.replace(ROUTES.MAIN.KHATA)}
                            />
                        </GlassCard>
                    </ScrollView>
                </SafeAreaView>
            </GradientBackground>
        );
    }

    // Chart data
    const dailyData = getDailyTotals(expenses);
    const categoryData = groupByCategory(expenses);
    const categoryLabels = Object.keys(categoryData).filter(k => categoryData[k as keyof typeof categoryData] > 0);
    const categoryValues = categoryLabels.map(k => categoryData[k as keyof typeof categoryData]);

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
                        <Text style={styles.title}>Budget Insights</Text>
                        <Text style={styles.subtitle}>AI-powered analysis</Text>
                    </Animated.View>

                    {/* AI Insights */}
                    {insights.length > 0 ? (
                        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                            <GlassCard style={styles.insightsCard}>
                                <Text style={styles.cardTitle}>AI Analysis</Text>
                                {insights.map((insight, index) => (
                                    <View key={index} style={styles.insightRow}>
                                        <View
                                            style={[
                                                styles.insightBadge,
                                                {
                                                    backgroundColor:
                                                        insight.type === 'critical'
                                                            ? theme.colors.error.DEFAULT
                                                            : insight.type === 'warning'
                                                                ? theme.colors.warning.DEFAULT
                                                                : theme.colors.success.DEFAULT,
                                                },
                                            ]}
                                        >
                                            <Text style={styles.insightBadgeText}>
                                                {insight.type === 'critical' ? 'CRIT' : insight.type === 'warning' ? 'WARN' : 'OK'}
                                            </Text>
                                        </View>
                                        <View style={styles.insightContent}>
                                            <Text style={styles.insightMessage}>{insight.message}</Text>
                                            <Text style={styles.insightAction}>Next: {insight.action}</Text>
                                        </View>
                                    </View>
                                ))}
                            </GlassCard>
                        </Animated.View>
                    ) : (
                        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                            <AnimatedButton
                                title={isLoadingAI ? 'Analyzing...' : 'Get AI Analysis'}
                                variant="primary"
                                size="lg"
                                fullWidth
                                onPress={handleAnalyze}
                                disabled={isLoadingAI}
                            />
                        </Animated.View>
                    )}

                    {/* Daily Spend Chart */}
                    {dailyData.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                            <GlassCard style={styles.chartCard}>
                                <Text style={styles.cardTitle}>Daily Spending</Text>
                                <LineChart
                                    data={{
                                        labels: dailyData.slice(-7).map(d => d.date.split('-')[2]),
                                        datasets: [{ data: dailyData.slice(-7).map(d => d.total) }],
                                    }}
                                    width={CHART_WIDTH - 48}
                                    height={180}
                                    yAxisLabel=""
                                    yAxisSuffix=""
                                    chartConfig={chartConfig}
                                    bezier
                                    style={styles.chart}
                                    withInnerLines={false}
                                    withOuterLines={false}
                                    withVerticalLines={false}
                                />
                            </GlassCard>
                        </Animated.View>
                    )}

                    {/* Category Breakdown Chart */}
                    {categoryLabels.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
                            <GlassCard style={styles.chartCard}>
                                <Text style={styles.cardTitle}>Category Breakdown</Text>
                                {/* @ts-ignore */}
                                <BarChart
                                    data={{
                                        labels: categoryLabels.map(l => l.substring(0, 4)),
                                        datasets: [{ data: categoryValues }],
                                    }}
                                    width={CHART_WIDTH - 48}
                                    height={200}
                                    yAxisLabel=""
                                    yAxisSuffix=""
                                    chartConfig={chartConfig}
                                    style={styles.chart}
                                    showValuesOnTopOfBars
                                    fromZero
                                    withInnerLines={false}
                                />
                            </GlassCard>
                        </Animated.View>
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
    insightsCard: { padding: 24, marginBottom: 20 },
    emptyStatePanel: { padding: 28, gap: 14 },
    emptyStateTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text.primary },
    emptyStateText: { fontSize: 15, lineHeight: 22, color: theme.colors.text.secondary, marginBottom: 8 },
    cardTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 16 },
    insightRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
    insightBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    insightBadgeText: { fontSize: 14 },
    insightContent: { flex: 1 },
    insightMessage: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 },
    insightAction: { fontSize: 13, color: theme.colors.text.secondary },
    chartCard: { padding: 24, marginBottom: 20 },
    chart: { marginTop: 16, borderRadius: 16 },
    bottomSpacer: { height: 40 },
});
