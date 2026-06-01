
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../../src/components/ui';
import { useAuthStore } from '../../src/stores/authStore';
import { useToastStore } from '../../src/stores/toastStore';
import { safeImpactAsync, ImpactFeedbackStyle, NotificationFeedbackType, safeNotificationAsync } from '../../src/utils/haptics';
import { ALTASAI_COLORS } from '../../src/theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../src/theme/typography';
import { ALTASAI_SPACING } from '../../src/theme/spacing';
import { ROUTES } from '../../src/constants/routes';

export default function OnboardingScreen() {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { completeOnboarding } = useAuthStore();
    const showToast = useToastStore((state) => state.showToast);

    const steps = [
        {
            title: 'Welcome to AltasAI',
            subtitle: 'Your Personal Discipline & Life Operating System',
            description: 'Build disciplined, focused, self-aware habits. This is not a social app. This is a human development system.',
            emoji: '🎯',
        },
        {
            title: 'Track Your Discipline',
            subtitle: 'Daily Tasks, Goals & Reflections',
            description: 'Create tasks, set goals, and reflect on your progress every night. AltasAI learns from your patterns and holds you accountable.',
            emoji: '📊',
        },
        {
            title: 'Choose Your Mentor Mode',
            subtitle: 'From Supportive to Ruthless',
            description: 'Select how strict you want AltasAI to be: Mentor (supportive), Strict (accountable), or Ruthless (zero excuses). You can change this anytime.',
            emoji: '⚡',
        },
    ];

    const currentStep = steps[step];
    const isLastStep = step === steps.length - 1;

    const handleNext = async () => {
        safeImpactAsync(ImpactFeedbackStyle.Medium);

        if (isLastStep) {
            try {
                setIsSubmitting(true);
                await completeOnboarding({
                    disciplineLevel: 'strict',
                    focusAreas: ['career', 'personal'],
                    lifeRhythm: {
                        wakeTime: '06:00',
                        sleepTime: '22:00',
                    },
                });
                safeNotificationAsync(NotificationFeedbackType.Success);
                showToast('Welcome to AltasAI!', 'success');
                // Navigate to root — auth gate will redirect to (main)
                setTimeout(() => {
                    router.replace(ROUTES.ROOT);
                }, 500);
            } catch (error) {
                showToast('Failed to complete setup. Please try again.', 'error');
                setIsSubmitting(false);
            }
        } else {
            setStep(step + 1);
        }
    };

    const handleSkip = async () => {
        safeImpactAsync(ImpactFeedbackStyle.Light);
        try {
            setIsSubmitting(true);
            await completeOnboarding({
                disciplineLevel: 'strict',
                focusAreas: ['career', 'personal'],
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
        } catch (error) {
            showToast('Failed to complete setup. Please try again.', 'error');
            setIsSubmitting(false);
        }
    };

    return (
        <GradientBackground variant="subtle">
            <SafeAreaView style={styles.container}>
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

                    {/* Emoji */}
                    <Text style={styles.emoji}>{currentStep.emoji}</Text>

                    {/* Title */}
                    <Text style={styles.title}>{currentStep.title}</Text>
                    <Text style={styles.subtitle}>{currentStep.subtitle}</Text>

                    {/* Description */}
                    <Text style={styles.description}>{currentStep.description}</Text>

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
            </SafeAreaView>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: ALTASAI_SPACING[8],
        paddingVertical: ALTASAI_SPACING[10],
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipButton: {
        position: 'absolute',
        top: ALTASAI_SPACING[5],
        right: ALTASAI_SPACING[8],
        paddingVertical: ALTASAI_SPACING[2],
        paddingHorizontal: ALTASAI_SPACING[4],
    },
    skipText: {
        color: ALTASAI_COLORS.text.tertiary,
        fontSize: ALTASAI_TYPOGRAPHY.size.sm,
        fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    },
    emoji: {
        fontSize: 80,
        marginBottom: ALTASAI_SPACING[8],
    },
    title: {
        fontSize: ALTASAI_TYPOGRAPHY.size['4xl'],
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
        marginBottom: ALTASAI_SPACING[6],
    },
    description: {
        fontSize: ALTASAI_TYPOGRAPHY.size.base,
        color: ALTASAI_COLORS.text.secondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: ALTASAI_SPACING[12],
        paddingHorizontal: ALTASAI_SPACING[4],
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: ALTASAI_SPACING[2],
        marginBottom: ALTASAI_SPACING[12],
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
