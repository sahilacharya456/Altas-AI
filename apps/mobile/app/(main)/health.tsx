import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import { safeImpactAsync, safeNotificationAsync, ImpactFeedbackStyle, NotificationFeedbackType } from '../../src/utils/haptics';
import {
    GradientBackground,
    GlassCard,
    AnimatedButton,
} from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/authStore';
import {
    logHealthData,
    getTodaysHealth,
    getWorkoutStreak,
    getAverageSleep,
} from '../../src/services/data';
import { ALTASAI_COLORS } from '../../src/theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../src/theme/typography';
import { ALTASAI_SPACING } from '../../src/theme/spacing';
const theme = { colors: ALTASAI_COLORS, typography: ALTASAI_TYPOGRAPHY, spacing: ALTASAI_SPACING };

const workoutTypes = [
    { label: 'Cardio', value: 'cardio' as const, icon: '🏃' },
    { label: 'Strength', value: 'strength' as const, icon: '💪' },
    { label: 'Yoga', value: 'yoga' as const, icon: '🧘' },
    { label: 'Rest', value: 'rest' as const, icon: '🛌' },
];

export default function HealthScreen() {
    const { user } = useAuthStore();
    const [sleepHours, setSleepHours] = useState(7);
    const [waterGlasses, setWaterGlasses] = useState(8);
    const [workoutMinutes, setWorkoutMinutes] = useState(0);
    const [workoutType, setWorkoutType] = useState<'cardio' | 'strength' | 'yoga' | 'rest' | 'other'>('rest');
    const [energyLevel, setEnergyLevel] = useState(3);
    const [overallHealth, setOverallHealth] = useState(3);
    const [stressLevel, setStressLevel] = useState(3);
    const [notes, setNotes] = useState('');
    const [streak, setStreak] = useState(0);
    const [avgSleep, setAvgSleep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (user?.uid) {
            loadData();
        }
    }, [user?.uid]);

    const loadData = async () => {
        if (!user?.uid) return;

        try {
            const today = await getTodaysHealth(user.uid);
            if (today) {
                setSleepHours(today.sleepHours);
                setWaterGlasses(today.waterGlasses);
                setWorkoutMinutes(today.workoutMinutes);
                setWorkoutType(today.workoutType);
                setEnergyLevel(today.energyLevel);
                setOverallHealth(today.overallHealth);
                setStressLevel(today.stressLevel || 3);
                setNotes(today.notes || '');
                setIsSaved(true);
            }

            const workoutStreakDays = await getWorkoutStreak(user.uid);
            const avgSleepHours = await getAverageSleep(user.uid);

            setStreak(workoutStreakDays);
            setAvgSleep(avgSleepHours);
        } catch (error) {
            console.error('Error loading health data:', error);
        }
    };

    const handleSave = async () => {
        if (!user?.uid) return;

        setIsLoading(true);
        safeImpactAsync(ImpactFeedbackStyle.Medium);

        try {
            await logHealthData(user.uid, {
                sleepHours,
                waterGlasses,
                workoutMinutes,
                workoutType,
                energyLevel,
                overallHealth,
                stressLevel,
                notes: notes.trim(),
            });

            setIsSaved(true);
            await loadData();

            safeNotificationAsync(NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Error saving health data:', error);
            safeNotificationAsync(NotificationFeedbackType.Error);
        } finally {
            setIsLoading(false);
        }
    };

    const routineScore = Math.min(100, Math.max(0,
        (sleepHours >= 7 ? 25 : sleepHours >= 6 ? 15 : 5) +
        (waterGlasses >= 8 ? 20 : waterGlasses >= 5 ? 12 : 4) +
        (workoutMinutes > 0 ? 20 : workoutType === 'rest' ? 12 : 0) +
        (energyLevel * 5) +
        (overallHealth * 4) -
        (stressLevel > 3 ? 8 : 0)
    ));
    const healthInsight = energyLevel <= 2
        ? 'Low energy will be sent to Cortex as execution risk. Use a lighter plan today.'
        : routineScore >= 75
            ? 'Routine score is strong. Cortex can treat this as readiness for focused execution.'
            : 'Routine data is incomplete. Sleep, water, workout, energy, mood, and stress drive the signal.';

    return (
        <GradientBackground variant="mesh">
            <SafeAreaView style={styles.container}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
                        <Text style={styles.title}>Energy and Routine Tracker</Text>
                        <Text style={styles.subtitle}>Track recovery signals without medical claims</Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                        <GlassCard style={styles.statusCard}>
                            <Text style={styles.cardTitle}>Routine Score</Text>
                            <Text style={[styles.statusScore, { color: routineScore >= 75 ? theme.colors.success.DEFAULT : routineScore >= 50 ? theme.colors.warning.DEFAULT : theme.colors.error.DEFAULT }]}>
                                {Math.round(routineScore)}/100
                            </Text>
                            <Text style={styles.cortexText}>{healthInsight}</Text>
                        </GlassCard>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                        <GlassCard style={styles.mainCard}>
                            <Text style={styles.cardTitle}>Today's Health Log</Text>

                            {/* Sleep */}
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>🛌 Sleep: {sleepHours}h</Text>
                                <Slider
                                    style={styles.slider}
                                    value={sleepHours}
                                    onValueChange={(v: number) => { setSleepHours(v); setIsSaved(false); }}
                                    minimumValue={0}
                                    maximumValue={12}
                                    step={0.5}
                                    minimumTrackTintColor={theme.colors.primary.DEFAULT}
                                />
                            </View>

                            {/* Water */}
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>💧 Water: {waterGlasses} glasses</Text>
                                <Slider
                                    style={styles.slider}
                                    value={waterGlasses}
                                    onValueChange={(v: number) => { setWaterGlasses(Math.round(v)); setIsSaved(false); }}
                                    minimumValue={0}
                                    maximumValue={20}
                                    step={1}
                                    minimumTrackTintColor={theme.colors.accent.DEFAULT}
                                />
                            </View>

                            {/* Workout */}
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>🏃‍♂️ Workout: {workoutMinutes} mins</Text>
                                <Slider
                                    style={styles.slider}
                                    value={workoutMinutes}
                                    onValueChange={(v: number) => { setWorkoutMinutes(v); setIsSaved(false); }}
                                    minimumValue={0}
                                    maximumValue={180}
                                    step={5}
                                    minimumTrackTintColor={theme.colors.success.DEFAULT}
                                />
                            </View>

                            {/* Workout Type */}
                            <Text style={styles.sectionLabel}>Workout Type</Text>
                            <View style={styles.workoutTypes}>
                                {workoutTypes.map(type => (
                                    <Pressable
                                        key={type.value}
                                        style={[
                                            styles.workoutTypeButton,
                                            workoutType === type.value && styles.workoutTypeButtonActive,
                                        ]}
                                        onPress={() => { setWorkoutType(type.value); setIsSaved(false); }}
                                    >
                                        <Text style={styles.workoutIcon}>{type.icon}</Text>
                                        <Text style={[
                                            styles.workoutLabel,
                                            workoutType === type.value && styles.workoutLabelActive,
                                        ]}>
                                            {type.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Energy */}
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>⚡ Energy: {energyLevel}/5</Text>
                                <Slider
                                    style={styles.slider}
                                    value={energyLevel}
                                    onValueChange={(v: number) => { setEnergyLevel(Math.round(v)); setIsSaved(false); }}
                                    minimumValue={1}
                                    maximumValue={5}
                                    step={1}
                                    minimumTrackTintColor={theme.colors.warning.DEFAULT}
                                />
                            </View>

                            {/* Overall Health */}
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>Mood/body check: {overallHealth}/5</Text>
                                <Slider
                                    style={styles.slider}
                                    value={overallHealth}
                                    onValueChange={(v: number) => { setOverallHealth(Math.round(v)); setIsSaved(false); }}
                                    minimumValue={1}
                                    maximumValue={5}
                                    step={1}
                                    minimumTrackTintColor={theme.colors.error.DEFAULT}
                                />
                            </View>

                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>Stress: {stressLevel}/5</Text>
                                <Slider
                                    style={styles.slider}
                                    value={stressLevel}
                                    onValueChange={(v: number) => { setStressLevel(Math.round(v)); setIsSaved(false); }}
                                    minimumValue={1}
                                    maximumValue={5}
                                    step={1}
                                    minimumTrackTintColor={theme.colors.warning.DEFAULT}
                                />
                            </View>

                            <Text style={styles.cortexText}>
                                Cortex signal: low energy, completed workouts, and strong routine days are emitted as behavior events for future risk scoring.
                            </Text>

                            {/* Notes */}
                            <Text style={styles.sectionLabel}>Notes (optional)</Text>
                            <TextInput
                                style={styles.notesInput}
                                placeholder="How's your body feeling?"
                                placeholderTextColor={theme.colors.text.tertiary}
                                value={notes}
                                onChangeText={(text) => { setNotes(text); setIsSaved(false); }}
                                multiline
                                maxLength={200}
                            />

                            <AnimatedButton
                                title={isSaved ? 'Saved ✓' : 'Save Health Log'}
                                variant={isSaved ? 'secondary' : 'primary'}
                                size="lg"
                                fullWidth
                                onPress={handleSave}
                                disabled={isLoading || isSaved}
                            />
                        </GlassCard>
                    </Animated.View>

                    {/* Stats */}
                    <Animated.View entering={FadeInDown.delay(400).duration(600)}>
                        <View style={styles.statsRow}>
                            <GlassCard style={styles.statCard}>
                                <Text style={styles.statEmoji}>🔥</Text>
                                <Text style={styles.statValue}>{streak}</Text>
                                <Text style={styles.statLabel}>Workout Streak</Text>
                            </GlassCard>

                            <GlassCard style={styles.statCard}>
                                <Text style={styles.statEmoji}>😴</Text>
                                <Text style={styles.statValue}>{avgSleep}h</Text>
                                <Text style={styles.statLabel}>Avg Sleep (7d)</Text>
                            </GlassCard>
                        </View>
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
    title: { fontSize: 32, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
    subtitle: { fontSize: 16, color: theme.colors.text.tertiary },
    mainCard: { padding: 24, marginBottom: 20 },
    statusCard: { padding: 24, marginBottom: 20 },
    statusScore: { fontSize: 36, fontWeight: '800', marginBottom: 8 },
    cortexText: { fontSize: 13, lineHeight: 19, color: theme.colors.text.secondary, marginBottom: 14 },
    cardTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 20 },
    metricRow: { marginBottom: 20 },
    metricLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text.secondary, marginBottom: 8 },
    slider: { width: '100%', height: 40 },
    sectionLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text.secondary, marginBottom: 12 },
    workoutTypes: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    workoutTypeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
    },
    workoutTypeButtonActive: { backgroundColor: theme.colors.primary.DEFAULT },
    workoutIcon: { fontSize: 24, marginBottom: 4 },
    workoutLabel: { fontSize: 10, color: theme.colors.text.tertiary, fontWeight: '600' },
    workoutLabelActive: { color: '#FFFFFF' },
    notesInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 12,
        color: theme.colors.text.primary,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    statCard: { flex: 1, padding: 20, alignItems: 'center' },
    statEmoji: { fontSize: 32, marginBottom: 8 },
    statValue: { fontSize: 24, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 4 },
    statLabel: { fontSize: 11, color: theme.colors.text.tertiary, textTransform: 'uppercase' },
    bottomSpacer: { height: 40 },
});
