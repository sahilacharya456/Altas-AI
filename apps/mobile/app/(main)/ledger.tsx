import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { safeImpactAsync, safeNotificationAsync, ImpactFeedbackStyle, NotificationFeedbackType } from '../../src/utils/haptics';
import { GradientBackground, GlassCard, AnimatedButton } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/authStore';
import {
    getAllKhataEntries,
    getPersonBalance,
    settleKhataEntry,
    addKhataEntry,
} from '../../src/services/data';
import type { KhataEntry } from '../../src/types/firestore';
import { ALTASAI_COLORS } from '../../src/theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../src/theme/typography';
import { ALTASAI_SPACING } from '../../src/theme/spacing';
import { convertToDate } from '../../src/utils/dateUtils';
const theme = { colors: ALTASAI_COLORS, typography: ALTASAI_TYPOGRAPHY, spacing: ALTASAI_SPACING };

export default function LedgerScreen() {
    const { user } = useAuthStore();
    const [entries, setEntries] = useState<KhataEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEntry, setNewEntry] = useState({
        personName: '',
        amount: '',
        type: 'borrowed' as 'borrowed' | 'lent',
        note: '',
    });

    useEffect(() => {
        if (user?.uid) {
            loadEntries();
        } else {
            setIsLoading(false);
        }
    }, [user?.uid]);

    const loadEntries = async () => {
        if (!user?.uid) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const data = await getAllKhataEntries(user.uid);
            setEntries(data);
        } catch (error) {
            console.error('Error loading khata entries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettle = async (entryId: string) => {
        safeImpactAsync(ImpactFeedbackStyle.Medium);

        try {
            await settleKhataEntry(entryId);
            await loadEntries();
            safeNotificationAsync(NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Error settling entry:', error);
            safeNotificationAsync(NotificationFeedbackType.Error);
        }
    };

    const handleAddEntry = async () => {
        if (!user?.uid || !newEntry.personName || !newEntry.amount || Number(newEntry.amount) <= 0) {
            safeNotificationAsync(NotificationFeedbackType.Error);
            return;
        }

        safeImpactAsync(ImpactFeedbackStyle.Medium);

        try {
            await addKhataEntry(user.uid, {
                personName: newEntry.personName.trim(),
                amount: Number(newEntry.amount),
                type: newEntry.type,
                note: newEntry.note.trim() || undefined,
            });

            await loadEntries();
            setShowAddModal(false);
            setNewEntry({ personName: '', amount: '', type: 'borrowed', note: '' });
            safeNotificationAsync(NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Error adding entry:', error);
            safeNotificationAsync(NotificationFeedbackType.Error);
        }
    };

    const personBalances = getPersonBalance(entries);

    if (isLoading) {
        return (
            <GradientBackground variant="mesh">
                <SafeAreaView style={styles.container}>
                    <Text style={styles.loadingText}>Loading...</Text>
                </SafeAreaView>
            </GradientBackground>
        );
    }

    if (showAddModal) {
        return (
            <GradientBackground variant="mesh">
                <SafeAreaView style={styles.container}>
                    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
                            <Pressable onPress={() => setShowAddModal(false)} style={styles.backButton}>
                            <Text style={styles.backText}>Back</Text>
                            </Pressable>
                            <Text style={styles.title}>Add Entry</Text>
                        </Animated.View>

                        <GlassCard style={styles.formCard}>
                            <Text style={styles.label}>Person Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., John, Priya"
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={newEntry.personName}
                                onChangeText={(text) => setNewEntry(prev => ({ ...prev, personName: text }))}
                                autoFocus
                            />

                            <Text style={styles.label}>Amount (Rs)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={newEntry.amount}
                                onChangeText={(text) => setNewEntry(prev => ({ ...prev, amount: text }))}
                                keyboardType="numeric"
                            />

                            <Text style={styles.label}>Type</Text>
                            <View style={styles.typeRow}>
                                <Pressable
                                    style={[styles.typeButton, newEntry.type === 'borrowed' && styles.typeButtonActive]}
                                    onPress={() => setNewEntry(prev => ({ ...prev, type: 'borrowed' }))}
                                >
                                    <Text style={[styles.typeText, newEntry.type === 'borrowed' && styles.typeTextActive]}>
                                        I Borrowed
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.typeButton, newEntry.type === 'lent' && styles.typeButtonActive]}
                                    onPress={() => setNewEntry(prev => ({ ...prev, type: 'lent' }))}
                                >
                                    <Text style={[styles.typeText, newEntry.type === 'lent' && styles.typeTextActive]}>
                                        I Lent
                                    </Text>
                                </Pressable>
                            </View>

                            <Text style={styles.label}>Note (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Reason or description"
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={newEntry.note}
                                onChangeText={(text) => setNewEntry(prev => ({ ...prev, note: text }))}
                            />

                            <AnimatedButton
                                title="Add Entry"
                                variant="primary"
                                size="lg"
                                fullWidth
                                onPress={handleAddEntry}
                            />
                        </GlassCard>
                    </ScrollView>
                </SafeAreaView>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground variant="mesh">
            <SafeAreaView style={styles.container}>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                    <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
                        <Pressable onPress={() => router.back()} style={styles.backButton}>
                            <Text style={styles.backText}>Back</Text>
                        </Pressable>
                        <Text style={styles.title}>Borrow/Lend Ledger</Text>
                        <Text style={styles.subtitle}>Track money owed</Text>
                    </Animated.View>

                    {personBalances.length === 0 ? (
                        <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                            <GlassCard style={styles.emptyCard}>
                                <Text style={styles.emptyIcon}>LEDGER</Text>
                                <Text style={styles.emptyText}>No entries yet</Text>
                                <Text style={styles.emptySubtext}>Add your first borrow/lend entry</Text>
                            </GlassCard>
                        </Animated.View>
                    ) : (
                        personBalances.map((person, index) => (
                            <Animated.View
                                key={person.personName}
                                entering={FadeInDown.delay(100 + index * 50).duration(600)}
                            >
                                <GlassCard style={styles.personCard}>
                                    <View style={styles.personHeader}>
                                        <Text style={styles.personName}>{person.personName}</Text>
                                        <Text
                                            style={[
                                                styles.personBalance,
                                                person.netBalance < 0 ? styles.balanceDebt : styles.balanceCredit,
                                            ]}
                                        >
                                            {person.netBalance < 0 ? 'You Owe: ' : 'Owes You: '}
                                            Rs {Math.abs(person.netBalance).toLocaleString()}
                                        </Text>
                                    </View>

                                    {person.pendingEntries.map((entry) => (
                                        <View key={entry.id} style={styles.entryRow}>
                                            <View style={styles.entryInfo}>
                                                <Text style={styles.entryType}>
                                                    {entry.type === 'borrowed' ? 'Borrowed' : 'Lent'}
                                                </Text>
                                                <Text style={styles.entryAmount}>
                                                    Rs {(entry.amount - entry.amountSettled).toLocaleString()}
                                                </Text>
                                                {entry.note && <Text style={styles.entryNote}>{entry.note}</Text>}
                                                <Text style={styles.entryDate}>
                                                    {convertToDate(entry.createdAt).toLocaleDateString('en-IN')}
                                                </Text>
                                            </View>
                                            {entry.status !== 'settled' && (
                                                <Pressable
                                                    style={styles.settleButton}
                                                    onPress={() => handleSettle(entry.id)}
                                                >
                                                    <Text style={styles.settleText}>Settle</Text>
                                                </Pressable>
                                            )}
                                        </View>
                                    ))}
                                </GlassCard>
                            </Animated.View>
                        ))
                    )}

                    <Animated.View entering={FadeInDown.delay(400).duration(600)}>
                        <AnimatedButton
                            title="+ Add Entry"
                            variant="primary"
                            size="lg"
                            fullWidth
                            onPress={() => setShowAddModal(true)}
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
    loadingText: { fontSize: 16, color: theme.colors.text.secondary, textAlign: 'center', marginTop: 100 },
    header: { paddingTop: 20, paddingBottom: 24 },
    backButton: { marginBottom: 16 },
    backText: { fontSize: 16, color: theme.colors.primary.DEFAULT, fontWeight: '600' },
    title: { fontSize: 32, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
    subtitle: { fontSize: 16, color: theme.colors.text.tertiary },
    emptyCard: { padding: 40, alignItems: 'center', marginTop: 40 },
    emptyIcon: { fontSize: 12, fontWeight: '800', letterSpacing: 0, color: theme.colors.primary.DEFAULT, marginBottom: 16 },
    emptyText: { fontSize: 18, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: theme.colors.text.tertiary },
    personCard: { padding: 20, marginBottom: 16 },
    personHeader: { marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
    personName: { fontSize: 20, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
    personBalance: { fontSize: 16, fontWeight: '600' },
    balanceDebt: { color: theme.colors.error.DEFAULT },
    balanceCredit: { color: theme.colors.success.DEFAULT },
    entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
    entryInfo: { flex: 1 },
    entryType: { fontSize: 12, color: theme.colors.text.tertiary, marginBottom: 4, textTransform: 'uppercase' },
    entryAmount: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 4 },
    entryNote: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: 4 },
    entryDate: { fontSize: 12, color: theme.colors.text.tertiary },
    settleButton: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.colors.success.DEFAULT, borderRadius: 8 },
    settleText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
    formCard: { padding: 24 },
    label: { fontSize: 14, fontWeight: '600', color: theme.colors.text.secondary, marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        color: theme.colors.text.primary,
        fontSize: 16,
        marginBottom: 8,
    },
    typeRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
    typeButton: {
        flex: 1,
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeButtonActive: { borderColor: theme.colors.primary.DEFAULT, backgroundColor: 'rgba(255, 255, 255, 0.1)' },
    typeText: { fontSize: 14, fontWeight: '600', color: theme.colors.text.tertiary },
    typeTextActive: { color: theme.colors.text.primary },
    bottomSpacer: { height: 40 },
});
