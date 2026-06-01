import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';

import { safeSelectionAsync } from '../../../utils/haptics';
import {
  AnimatedButton,
  AnimatedProgressRing,
  GlassCard,
  PulseCircle,
  TypewriterText,
} from '../../../components/ui';
import { theme } from '../../../theme';
import { energyOptions, moodOptions } from '../constants';
import type { DaySummary } from '../types';
import { ReflectionMoodOption } from './ReflectionMoodOption';
import { styles } from './reflectionStyles';

interface IntroStepProps {
  daySummary: DaySummary;
  onStart: () => void;
}

export function IntroStep({ daySummary, onStart }: IntroStepProps) {
  const completionRate = daySummary.totalTasks > 0
    ? daySummary.tasksCompleted / daySummary.totalTasks
    : 0;

  return (
    <ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Moon Icon */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(600)}
        style={styles.moonContainer}
      >
        <Text style={styles.moonEmoji}>{'\u{1F319}'}</Text>
        <View style={styles.moonGlow} />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).duration(600)}>
        <Text style={styles.introTitle}>Time to Reflect</Text>
        <Text style={styles.introSubtitle}>
          Let's review your day and prepare for tomorrow
        </Text>
      </Animated.View>

      {/* Day Summary Card */}
      <Animated.View entering={FadeInUp.delay(600).duration(600)}>
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>TODAY'S SUMMARY</Text>

          <View style={styles.summaryRing}>
            <AnimatedProgressRing
              progress={completionRate}
              size={120}
              strokeWidth={10}
              showPercentage
              label="Completed"
            />
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{daySummary.tasksCompleted}/{daySummary.totalTasks}</Text>
              <Text style={styles.summaryStatLabel}>Tasks</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{Math.round(daySummary.focusMinutes / 60)}h</Text>
              <Text style={styles.summaryStatLabel}>Focus</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{daySummary.screenTime}h</Text>
              <Text style={styles.summaryStatLabel}>Screen</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(800).duration(600)}
        style={styles.introAction}
      >
        <AnimatedButton
          title="Begin Reflection"
          variant="glow"
          size="lg"
          fullWidth
          onPress={onStart}
        />
        <Text style={styles.introTime}>Takes about 60 seconds</Text>
      </Animated.View>
    </ScrollView>
  );
}

interface MoodStepProps {
  value: number | null;
  onChange: (value: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function MoodStep({ value, onChange, onNext, onBack }: MoodStepProps) {
  return (
    <View style={styles.stepContainer}>
      <Animated.View entering={SlideInRight.duration(400)} style={styles.questionContainer}>
        <Text style={styles.questionEmoji}>{'\u{1F60C}'}</Text>
        <Text style={styles.questionTitle}>How do you feel?</Text>
        <Text style={styles.questionSubtitle}>Rate your overall mood today</Text>

        <View style={styles.optionsRow}>
          {moodOptions.map((option, index) => (
            <ReflectionMoodOption
              key={option.value}
              option={option}
              selected={value === option.value}
              onSelect={() => {
                safeSelectionAsync();
                onChange(option.value);
              }}
              index={index}
            />
          ))}
        </View>

        <View style={styles.navigationButtons}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'\u2190'} Back</Text>
          </Pressable>

          <AnimatedButton
            title="Continue"
            variant="primary"
            size="md"
            disabled={value === null}
            onPress={onNext}
          />
        </View>
      </Animated.View>
    </View>
  );
}

interface EnergyStepProps {
  value: number | null;
  onChange: (value: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export function EnergyStep({ value, onChange, onNext, onBack }: EnergyStepProps) {
  return (
    <View style={styles.stepContainer}>
      <Animated.View entering={SlideInRight.duration(400)} style={styles.questionContainer}>
        <Text style={styles.questionEmoji}>{'\u26A1'}</Text>
        <Text style={styles.questionTitle}>Energy Level</Text>
        <Text style={styles.questionSubtitle}>How was your energy throughout the day?</Text>

        <View style={styles.optionsRow}>
          {energyOptions.map((option, index) => (
            <ReflectionMoodOption
              key={option.value}
              option={option}
              selected={value === option.value}
              onSelect={() => {
                safeSelectionAsync();
                onChange(option.value);
              }}
              index={index}
            />
          ))}
        </View>

        <View style={styles.navigationButtons}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'\u2190'} Back</Text>
          </Pressable>

          <AnimatedButton
            title="Continue"
            variant="primary"
            size="md"
            disabled={value === null}
            onPress={onNext}
          />
        </View>
      </Animated.View>
    </View>
  );
}

interface TextInputStepProps {
  title: string;
  subtitle: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  emoji: string;
}

export function TextInputStep({
  title,
  subtitle,
  placeholder,
  value,
  onChange,
  onNext,
  onBack,
  emoji,
}: TextInputStepProps) {
  return (
    <View style={styles.stepContainer}>
      <Animated.View entering={SlideInRight.duration(400)} style={styles.questionContainer}>
        <Text style={styles.questionEmoji}>{emoji}</Text>
        <Text style={styles.questionTitle}>{title}</Text>
        <Text style={styles.questionSubtitle}>{subtitle}</Text>

        <GlassCard style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.text.tertiary}
            value={value}
            onChangeText={onChange}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </GlassCard>

        <Text style={styles.skipHint}>Optional - tap Continue to skip</Text>

        <View style={styles.navigationButtons}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'\u2190'} Back</Text>
          </Pressable>

          <AnimatedButton
            title="Continue"
            variant="primary"
            size="md"
            onPress={onNext}
          />
        </View>
      </Animated.View>
    </View>
  );
}

interface SummaryStepProps {
  mood: number | null;
  energy: number | null;
  wins: string;
  challenges: string;
  gratitude: string;
  aiInsight: string;
  isGenerating: boolean;
  onComplete: () => void;
  onBack: () => void;
}

export function SummaryStep({
  mood,
  energy,
  wins,
  challenges,
  gratitude,
  aiInsight,
  isGenerating,
  onComplete,
  onBack,
}: SummaryStepProps) {
  const moodOption = moodOptions.find((m) => m.value === mood);
  const energyOption = energyOptions.find((e) => e.value === energy);

  return (
    <ScrollView
      style={styles.stepContainer}
      contentContainerStyle={styles.stepContent}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View entering={FadeInDown.delay(200).duration(600)}>
        <Text style={styles.summaryHeading}>Reflection Complete</Text>
        <Text style={styles.summarySubheading}>Here's your day at a glance</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400).duration(600)}>
        <GlassCard glow glowColor={theme.colors.primary.glow} style={styles.reflectionCard}>
          <View style={styles.reflectionRow}>
            <View style={styles.reflectionItem}>
              <Text style={styles.reflectionEmoji}>{moodOption?.emoji || '\u{1F610}'}</Text>
              <Text style={styles.reflectionLabel}>Mood</Text>
              <Text style={styles.reflectionValue}>{moodOption?.label || 'N/A'}</Text>
            </View>
            <View style={styles.reflectionDivider} />
            <View style={styles.reflectionItem}>
              <Text style={styles.reflectionEmoji}>{energyOption?.emoji || '\u26A1'}</Text>
              <Text style={styles.reflectionLabel}>Energy</Text>
              <Text style={styles.reflectionValue}>{energyOption?.label || 'N/A'}</Text>
            </View>
          </View>

          {wins ? (
            <View style={styles.reflectionSection}>
              <Text style={styles.reflectionSectionTitle}>{'\u{1F3C6}'} Wins</Text>
              <Text style={styles.reflectionSectionText}>{wins}</Text>
            </View>
          ) : null}

          {challenges ? (
            <View style={styles.reflectionSection}>
              <Text style={styles.reflectionSectionTitle}>{'\u{1F3AF}'} Challenges</Text>
              <Text style={styles.reflectionSectionText}>{challenges}</Text>
            </View>
          ) : null}

          {gratitude ? (
            <View style={styles.reflectionSection}>
              <Text style={styles.reflectionSectionTitle}>{'\u{1F64F}'} Gratitude</Text>
              <Text style={styles.reflectionSectionText}>{gratitude}</Text>
            </View>
          ) : null}
        </GlassCard>
      </Animated.View>

      {/* AI Insight */}
      <Animated.View entering={FadeInUp.delay(600).duration(600)}>
        <GlassCard style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <PulseCircle size={10} color={theme.colors.accent.DEFAULT} pulseCount={2} />
            <Text style={styles.insightTitle}>ALTASAI INSIGHT</Text>
          </View>
          {isGenerating ? (
            <Text style={styles.insightText}>Generating analysis...</Text>
          ) : (
            <TypewriterText
              text={aiInsight}
              style={styles.insightText}
              typingSpeed={25}
              startDelay={0}
            />
          )}
        </GlassCard>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(800).duration(600)}
        style={styles.completeActions}
      >
        <AnimatedButton
          title="Save & Close"
          variant="glow"
          size="lg"
          fullWidth
          onPress={onComplete}
        />

        <Pressable onPress={onBack} style={styles.editButton}>
          <Text style={styles.editButtonText}>{'\u2190'} Edit Reflection</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}
