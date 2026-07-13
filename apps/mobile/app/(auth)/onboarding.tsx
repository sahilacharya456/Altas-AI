
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/authStore';
import { useToastStore } from '../../src/stores/toastStore';
import { safeImpactAsync, safeSelectionAsync, ImpactFeedbackStyle, NotificationFeedbackType, safeNotificationAsync } from '../../src/utils/haptics';
import { ALTASAI_COLORS } from '../../src/theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../src/theme/typography';
import { ALTASAI_SPACING } from '../../src/theme/spacing';
import { ALTASAI_RADIUS } from '../../src/theme/radius';
import { ROUTES } from '../../src/constants/routes';
import { DISCIPLINE_LEVELS, FOCUS_AREAS, type DisciplineLevel, type FocusArea } from '../../src/constants/discipline';

export default function OnboardingScreen() {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedLevel, setSelectedLevel] = useState<DisciplineLevel>('strict');
    const [selectedAreas, setSelectedAreas] = useState<FocusArea[]>([]);
    const { completeOnboarding } = useAuthStore();
    const showToast = useToastStore((state) => state.showToast);

    const totalSteps = 4;
    const isLastStep = step === totalSteps - 1;
    const isFocusAreasStep = step === 2;
    const isDisciplineStep = step === 3;

    const steps = [
        {
            title: 'Welcome to AltasAI',
            subtitle: 'Your Personal Discipline & Life Operating System',
            description: 'Build disciplined, focused, self-aware habits. This is not a social app. This is a human development system.',
            icon: 'GO',
        },
        {
            title: 'Track Your Discipline',
            subtitle: 'Daily Tasks, Goals & Reflections',
            description: 'Create tasks, set goals, and reflect on your progress every night. AltasAI learns from your patterns and holds you accountable.',
            icon: 'TR',
        },
        {
            title: 'Your Focus Areas',
            subtitle: 'What are you building discipline around?',
            description: 'Select the areas you want AltasAI to help you with. Pick at least one.',
            icon: 'FA',
        },
        {
            title: 'Choose Your Mentor Mode',
            subtitle: 'How strict should AltasAI be?',
            description: 'Select your accountability level. You can change this anytime in Profile settings.',
            icon: 'AI',
        },
    ];

    const currentStep = steps[step];

    const toggleArea = (area: FocusArea) => {
        safeSelectionAsync();
        setSelectedAreas((prev) =>
            prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
        );
    };

    const finishOnboarding = async (level: DisciplineLevel) => {
        try {
            setIsSubmitting(true);
            await completeOnboarding({
                disciplineLevel: level,
                focusAreas: selectedAreas.length > 0 ? selectedAreas : ['career', 'personal'],
                lifeRhythm: {
                    wakeTime: '06:00',
                    sleepTime: '22:00',
                },
            });
            safeNotificationAsync(NotificationFeedbackType.Success);
            showToast('Welcome to AltasAI!', 'success');
            setTimeout(() => {
                router.replace(ROUTES.ROOT);
            }, 500);
        } catch {
            showToast('Failed to complete setup. Please try again.', 'error');
            setIsSubmitting(false);
        }
    };

    const handleNext = async () => {
        safeImpactAsync(ImpactFeedbackStyle.Medium);

        if (isFocusAreasStep && selectedAreas.length === 0) {
            showToast('Select at least one focus area.', 'error');
            return;
        }

        if (isLastStep) {
            await finishOnboarding(selectedLevel);
        } else {
            setStep(step + 1);
        }
    };

    const handleSkip = async () => {
        safeImpactAsync(ImpactFeedbackStyle.Light);
        await finishOnboarding('strict');
    };

    return (
        <GradientBackground variant="subtle">
            <SafeAreaView style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View
                        key={step}
                        entering={FadeInDown.duration(600)}
                        style={styles.content}
                    >
                        {/* Skip Button */}
                        {!isLastStep && (
                            <Pressable style={styles.skipButton} onPress={handleSkip} disabled={isSubmitting}>
                                <Text style={styles.skipText}>Skip</Text>
                            </Pressable>
                        )}

                        {/* Step icon */}
                        <Text style={styles.emoji}>{currentStep.icon}</Text>

                        {/* Title */}
                        <Text style={styles.title}>{currentStep.title}</Text>
                        <Text style={styles.subtitle}>{currentStep.subtitle}</Text>

                        {/* Description */}
                        <Text style={styles.description}>{currentStep.description}</Text>

                        {/* Focus Areas Selection (Step 3) */}
                        {isFocusAreasStep && (
                            <View style={styles.selectionContainer}>
                                {(Object.keys(FOCUS_AREAS) as FocusArea[]).map((area) => {
                                    const config = FOCUS_AREAS[area];
                                    const isSelected = selectedAreas.includes(area);

                                    return (
                                        <Pressable
                                            key={area}
                                            style={[
                                                styles.levelCard,
                                                isSelected && { borderColor: ALTASAI_COLORS.accent.primary },
                                            ]}
                                            onPress={() => toggleArea(area)}
                                            disabled={isSubmitting}
                                        >
                                            {isSelected && (
                                                <View style={[styles.levelAccent, { backgroundColor: ALTASAI_COLORS.accent.primary }]} />
                                            )}

                                            <View style={styles.levelContent}>
                                                <Text style={[styles.levelName, isSelected && { color: ALTASAI_COLORS.accent.primary }]}>
                                                    {config.name}
                                                </Text>
                                                <Text style={styles.levelDescription}>{config.description}</Text>
                                            </View>

                                            <View style={[
                                                styles.checkbox,
                                                isSelected && styles.checkboxSelected,
                                            ]}>
                                                {isSelected && <Text style={styles.checkmark}>OK</Text>}
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}

                        {/* Discipline Level Selection (Step 4) */}
                        {isDisciplineStep && (
                            <View style={styles.selectionContainer}>
                                {(Object.keys(DISCIPLINE_LEVELS) as DisciplineLevel[]).map((level) => {
                                    const config = DISCIPLINE_LEVELS[level];
                                    const isSelected = selectedLevel === level;

                                    return (
                                        <Pressable
                                            key={level}
                                            style={[
                                                styles.levelCard,
                                                isSelected && { borderColor: config.color },
                                            ]}
                                            onPress={() => {
                                                safeSelectionAsync();
                                                setSelectedLevel(level);
                                            }}
                                            disabled={isSubmitting}
                                        >
                                            {isSelected && (
                                                <View style={[styles.levelAccent, { backgroundColor: config.color }]} />
                                            )}

                                            <View style={styles.levelContent}>
                                                <View style={styles.levelHeader}>
                                                    <Text style={[styles.levelName, isSelected && { color: config.color }]}>
                                                        {config.name}
                                                    </Text>
                                                    {'recommended' in config && config.recommended && (
                                                        <View style={styles.recommendedBadge}>
                                                            <Text style={styles.recommendedText}>RECOMMENDED</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <Text style={styles.levelDescription}>{config.description}</Text>
                                            </View>

                                            <View style={[
                                                styles.radioOuter,
                                                isSelected && { borderColor: config.color },
                                            ]}>
                                                {isSelected && (
                                                    <View style={[styles.radioInner, { backgroundColor: config.color }]} />
                                                )}
                                            </View>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}

                        {/* Progress Dots */}
                        <View style={styles.dotsContainer}>
                            {steps.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        index === step && styles.dotActive,
                                    ]}
                                />
                            ))}
                        </View>

                        {/* Next Button */}
                        <Pressable onPress={handleNext} disabled={isSubmitting}>
                            <LinearGradient
                                colors={[ALTASAI_COLORS.primary.DEFAULT, ALTASAI_COLORS.accent.DEFAULT]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        {isLastStep ? 'Get Started' : 'Continue'}
                                    </Text>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: ALTASAI_SPACING[6],
        paddingVertical: ALTASAI_SPACING[10],
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipButton: {
        position: 'absolute',
        top: ALTASAI_SPACING[5],
        right: ALTASAI_SPACING[6],
        paddingVertical: ALTASAI_SPACING[2],
        paddingHorizontal: ALTASAI_SPACING[4],
    },
    skipText: {
        color: ALTASAI_COLORS.text.tertiary,
        fontSize: ALTASAI_TYPOGRAPHY.size.sm,
        fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    },
    emoji: {
        fontSize: 40,
        letterSpacing: 2,
        fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
        color: ALTASAI_COLORS.primary.light,
        marginBottom: ALTASAI_SPACING[6],
    },
    title: {
        fontSize: ALTASAI_TYPOGRAPHY.size['3xl'],
        fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
        color: ALTASAI_COLORS.text.primary,
        textAlign: 'center',
        marginBottom: ALTASAI_SPACING[2],
    },
    subtitle: {
        fontSize: ALTASAI_TYPOGRAPHY.size.lg,
        fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
        color: ALTASAI_COLORS.primary.light,
        textAlign: 'center',
        marginBottom: ALTASAI_SPACING[4],
    },
    description: {
        fontSize: ALTASAI_TYPOGRAPHY.size.base,
        color: ALTASAI_COLORS.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: ALTASAI_SPACING[8],
        paddingHorizontal: ALTASAI_SPACING[2],
    },
    selectionContainer: {
        width: '100%',
        gap: ALTASAI_SPACING[3],
        marginBottom: ALTASAI_SPACING[8],
    },
    levelCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: ALTASAI_COLORS.surface.raised,
        borderWidth: 2,
        borderColor: ALTASAI_COLORS.border.secondary,
        borderRadius: ALTASAI_RADIUS.xl,
        padding: ALTASAI_SPACING[4],
        overflow: 'hidden',
    },
    levelAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 3,
    },
    levelContent: {
        flex: 1,
        marginLeft: ALTASAI_SPACING[1],
    },
    levelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: ALTASAI_SPACING[2],
        marginBottom: 2,
    },
    levelName: {
        fontSize: ALTASAI_TYPOGRAPHY.size.base,
        fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
        color: ALTASAI_COLORS.text.primary,
    },
    levelDescription: {
        fontSize: ALTASAI_TYPOGRAPHY.size.sm,
        color: ALTASAI_COLORS.text.tertiary,
        lineHeight: 18,
    },
    recommendedBadge: {
        backgroundColor: ALTASAI_COLORS.accent.dim,
        paddingHorizontal: ALTASAI_SPACING[2],
        paddingVertical: 2,
        borderRadius: ALTASAI_RADIUS.full,
    },
    recommendedText: {
        color: ALTASAI_COLORS.accent.bright,
        fontSize: 10,
        fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: ALTASAI_COLORS.border.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: ALTASAI_SPACING[3],
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: ALTASAI_COLORS.border.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: ALTASAI_SPACING[3],
    },
    checkboxSelected: {
        borderColor: ALTASAI_COLORS.accent.primary,
        backgroundColor: ALTASAI_COLORS.accent.primary,
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: ALTASAI_SPACING[2],
        marginBottom: ALTASAI_SPACING[8],
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    dotActive: {
        backgroundColor: ALTASAI_COLORS.primary.DEFAULT,
        width: 24,
    },
    button: {
        paddingHorizontal: ALTASAI_SPACING[12],
        paddingVertical: ALTASAI_SPACING[4],
        borderRadius: 16,
        minWidth: 200,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: ALTASAI_TYPOGRAPHY.size.lg,
        fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    },
});
