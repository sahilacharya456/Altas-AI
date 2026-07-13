import React from 'react';
import {
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { GradientBackground } from '../../components/ui';
import { theme } from '../../theme';
import {
  EnergyStep,
  IntroStep,
  MoodStep,
  SummaryStep,
  TextInputStep,
} from './components';
import { styles } from './components/reflectionStyles';
import { useReflection } from './hooks/useReflection';

export default function ReflectionScreen() {
  const {
    currentStep,
    currentIndex,
    steps,
    mood,
    setMood,
    energy,
    setEnergy,
    wins,
    setWins,
    challenges,
    setChallenges,
    gratitude,
    setGratitude,
    aiInsight,
    isGeneratingInsight,
    daySummary,
    progressStyle,
    handleNext,
    handleBack,
    handleComplete,
  } = useReflection();

  const renderStep = () => {
    switch (currentStep) {
      case 'intro':
        return <IntroStep daySummary={daySummary} onStart={handleNext} />;
      case 'mood':
        return (
          <MoodStep
            value={mood}
            onChange={setMood}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'energy':
        return (
          <EnergyStep
            value={energy}
            onChange={setEnergy}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'wins':
        return (
          <TextInputStep
            title="Today's Wins"
            subtitle="What did you actually complete?"
            placeholder="Finished the report section, had a clean focus session..."
            value={wins}
            onChange={setWins}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'challenges':
        return (
          <TextInputStep
            title="What Blocked You"
            subtitle="Be honest - what slowed execution?"
            placeholder="Got distracted, underestimated the task, skipped the focus block..."
            value={challenges}
            onChange={setChallenges}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'gratitude':
        return (
          <TextInputStep
            title="What Helped You"
            subtitle="What supported your execution today?"
            placeholder="Quiet environment, clear task scope, good energy..."
            value={gratitude}
            onChange={setGratitude}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 'summary':
        return (
          <SummaryStep
            mood={mood}
            energy={energy}
            wins={wins}
            challenges={challenges}
            gratitude={gratitude}
            aiInsight={aiInsight}
            isGenerating={isGeneratingInsight}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <GradientBackground variant="mesh">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        {currentStep !== 'intro' && currentStep !== 'summary' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Night Reflection</Text>
              <Text style={styles.headerSubtitle}>
                Step {currentIndex} of {steps.length - 2}
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, progressStyle]}>
                  <LinearGradient
                    colors={[theme.colors.primary.light, theme.colors.accent.DEFAULT]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.progressGradient}
                  />
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {renderStep()}
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
