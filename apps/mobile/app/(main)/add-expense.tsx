import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { safeImpactAsync, safeNotificationAsync, ImpactFeedbackStyle, NotificationFeedbackType } from '../../src/utils/haptics';
import { GradientBackground, GlassCard, AnimatedButton } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/authStore';
import { addExpense, addExpenseToBudget } from '../../src/services/data';
import type { ExpenseCategory } from '../../src/types/firestore';
import { ALTASAI_COLORS } from '../../src/theme/colors';

const theme = { colors: ALTASAI_COLORS };

const CATEGORIES: { key: ExpenseCategory; label: string; icon: string; color: string }[] = [
    { key: 'food', label: 'Food', icon: '🍽️', color: theme.colors.primary.DEFAULT },
    { key: 'transport', label: 'Transport', icon: '🚗', color: theme.colors.accent.DEFAULT },
    { key: 'study', label: 'Study', icon: '📚', color: theme.colors.info.DEFAULT },
    { key: 'rent', label: 'Rent', icon: '🏠', color: theme.colors.warning.DEFAULT },
    { key: 'entertainment', label: 'Fun', icon: '🎬', color: theme.colors.success.DEFAULT },
    { key: 'misc', label: 'Other', icon: '📦', color: theme.colors.text.tertiary },
];

export default function AddExpenseScreen() {
    const { user } = useAuthStore();
    const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('food');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!user?.uid || !amount || Number(amount) <= 0) {
            safeNotificationAsync(NotificationFeedbackType.Error);
            return;
        }

        setIsSubmitting(true);
        safeImpactAsync(ImpactFeedbackStyle.Medium);

        try {
            const amountNum = Number(amount);

            // Add expense
            await addExpense(user.uid, {
                amount: amountNum,
                category: selectedCategory,
                note: note.trim() || undefined,
            });

            // Update budget
            await addExpenseToBudget(user.uid, amountNum, selectedCategory);

            safeNotificationAsync(NotificationFeedbackType.Success);
            router.back();
        } catch (error) {
            if (__DEV__) console.error('Error adding expense:', error);
            safeNotificationAsync(NotificationFeedbackType.Error);
            setIsSubmitting(false);
        }
    };

    const selectedCategoryData = CATEGORIES.find(c => c.key === selectedCategory);

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
                            <Text style={styles.backText}>← Back</Text>
                        </Pressable>
                        <Text style={styles.title}>Add Expense</Text>
                        <Text style={styles.subtitle}>Quick entry for today</Text>
                    </Animated.View>

                    {/* Amount Input */}
                    <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                        <GlassCard style={styles.amountCard}>
                            <Text style={styles.label}>Amount (₹)</Text>
                            <View style={styles.amountInputContainer}>
                                <Text style={styles.currencySymbol}>₹</Text>
                                <TextInput
                                    style={styles.amountInput}
                                    placeholder="0"
                                    placeholderTextColor={theme.colors.text.tertiary}
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                    autoFocus
                                    returnKeyType="done"
                                />
                            </View>
                        </GlassCard>
                    </Animated.View>

                    {/* Category Selector */}
                    <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                        <GlassCard style={styles.categoryCard}>
                            <Text style={styles.label}>Category</Text>
                            <View style={styles.categoriesGrid}>
                                {CATEGORIES.map((cat) => (
                                    <Pressable
                                        key={cat.key}
                                        style={[
                                            styles.categoryButton,
                                            selectedCategory === cat.key && styles.categoryButtonActive,
                                            selectedCategory === cat.key && { borderColor: cat.color },
                                        ]}
                                        onPress={() => {
                                            setSelectedCategory(cat.key);
                                            safeImpactAsync(ImpactFeedbackStyle.Light);
                                        }}
                                    >
                                        <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                        <Text
                                            style={[
                                                styles.categoryLabel,
                                                selectedCategory === cat.key && styles.categoryLabelActive,
                                            ]}
                                        >
                                            {cat.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </GlassCard>
                    </Animated.View>

                    {/* Note (Optional) */}
                    <Animated.View entering={FadeInDown.delay(300).duration(600)}>
                        <GlassCard style={styles.noteCard}>
                            <Text style={styles.label}>Note (optional)</Text>
                            <TextInput
                                style={styles.noteInput}
                                placeholder="e.g., 'Lunch with team'"
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={note}
                                onChangeText={setNote}
                                maxLength={100}
                                multiline
                                returnKeyType="done"
                            />
                        </GlassCard>
                    </Animated.View>

                    {/* Summary Preview */}
                    <Animated.View entering={FadeInDown.delay(400).duration(600)}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryLabel}>Preview</Text>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryIcon}>{selectedCategoryData?.icon}</Text>
                                <View style={styles.summaryInfo}>
                                    <Text style={styles.summaryCategory}>{selectedCategoryData?.label}</Text>
                                    <Text style={styles.summaryAmount}>
                                        ₹{amount || '0'}{note ? ` • ${note}` : ''}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Submit Button */}
                    <Animated.View entering={FadeInDown.delay(500).duration(600)}>
                        <AnimatedButton
                            title={isSubmitting ? 'Saving...' : 'Add Expense'}
                            variant="primary"
                            size="lg"
                            fullWidth
                            onPress={handleSubmit}
                            disabled={isSubmitting || !amount || Number(amount) <= 0}
                        />
                    </Animated.View>

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
    header: { paddingTop: 20, paddingBottom: 24 },
    backButton: { marginBottom: 16 },
    backText: { fontSize: 16, color: theme.colors.primary.DEFAULT, fontWeight: '600' },
    title: { fontSize: 32, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
    subtitle: { fontSize: 16, color: theme.colors.text.tertiary },
    amountCard: { padding: 24, marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: theme.colors.text.secondary, marginBottom: 12, textTransform: 'uppercase' },
    amountInputContainer: { flexDirection: 'row', alignItems: 'center' },
    currencySymbol: { fontSize: 36, fontWeight: '700', color: theme.colors.text.primary, marginRight: 8 },
    amountInput: {
        flex: 1,
        fontSize: 48,
        fontWeight: '700',
        color: theme.colors.text.primary,
        padding: 0,
    },
    categoryCard: { padding: 24, marginBottom: 20 },
    categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    categoryButton: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    categoryButtonActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
    },
    categoryIcon: { fontSize: 32, marginBottom: 8 },
    categoryLabel: { fontSize: 12, color: theme.colors.text.tertiary, fontWeight: '600' },
    categoryLabelActive: { color: theme.colors.text.primary },
    noteCard: { padding: 24, marginBottom: 20 },
    noteInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        color: theme.colors.text.primary,
        fontSize: 16,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    summaryCard: { padding: 20, marginBottom: 20, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 16 },
    summaryLabel: { fontSize: 12, color: theme.colors.text.tertiary, textTransform: 'uppercase', marginBottom: 12, fontWeight: '600' },
    summaryRow: { flexDirection: 'row', alignItems: 'center' },
    summaryIcon: { fontSize: 40, marginRight: 16 },
    summaryInfo: { flex: 1 },
    summaryCategory: { fontSize: 16, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 },
    summaryAmount: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary },
    bottomSpacer: { height: 40 },
});
