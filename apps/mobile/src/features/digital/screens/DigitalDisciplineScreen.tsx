import React from 'react';
import { Text, TextInput, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';

import { AnimatedButton, GlassCard, GradientBackground, PulseCircle } from '../../../components/ui';
import { ALTASAI_COLORS } from '../../../theme';
import { useDigitalDiscipline } from '../hooks/useDigitalDiscipline';
import { styles } from '../components/digitalStyles';

const getUsageDate = (value: unknown) => {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value && typeof value === 'object' && 'toMillis' in value) {
    return new Date((value as { toMillis: () => number }).toMillis());
  }
  return new Date();
};

export default function DigitalDisciplineScreen() {
  const {
    screenMinutes,
    setScreenMinutes,
    goalMinutes,
    setGoalMinutes,
    notes,
    setNotes,
    streak,
    weeklyAvg,
    history,
    isLoading,
    isSaved,
    markDirty,
    handleSave,
    metrics,
  } = useDigitalDiscipline();

  const scoreColor =
    metrics.distractionScore >= 80
      ? ALTASAI_COLORS.error.DEFAULT
      : metrics.distractionScore >= 55
        ? ALTASAI_COLORS.warning.DEFAULT
        : ALTASAI_COLORS.success.DEFAULT;

  return (
    <GradientBackground variant="mesh">
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
            <Text style={styles.title}>Distraction Intelligence</Text>
            <Text style={styles.subtitle}>Turn screen usage into Cortex execution signals</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <GlassCard style={styles.statusCard}>
              <Text style={styles.cardTitle}>Distraction Score</Text>
              <Text style={[styles.statusScore, { color: scoreColor }]}>
                {metrics.distractionScore}/100
              </Text>
              <Text style={styles.cortexText}>{metrics.digitalInsight}</Text>
              <Text style={styles.cortexText}>Key action: {metrics.focusRecommendation}</Text>
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <GlassCard style={styles.mainCard}>
              <Text style={styles.cardTitle}>Today's Screen Time</Text>

              <View style={styles.timeDisplay}>
                <Text style={[styles.timeValue, metrics.exceeded && styles.timeExceeded]}>
                  {metrics.hours}h {metrics.minutes}m
                </Text>
                <Text style={styles.timeLabel}>
                  Goal: {metrics.goalHours}h {metrics.goalMins}m
                </Text>
              </View>

              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${metrics.progress}%` },
                      metrics.exceeded && styles.progressExceeded,
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {metrics.exceeded
                    ? `${Math.round(metrics.rawProgress - 100)}% over goal`
                    : `${Math.round(100 - metrics.rawProgress)}% remaining`}
                </Text>
              </View>

              <Text style={styles.sliderLabel}>Screen Time (hours)</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={720}
                step={15}
                value={screenMinutes}
                onValueChange={(value) => {
                  setScreenMinutes(value);
                  markDirty();
                }}
                minimumTrackTintColor={metrics.exceeded ? ALTASAI_COLORS.error.DEFAULT : ALTASAI_COLORS.primary.DEFAULT}
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor={ALTASAI_COLORS.primary.DEFAULT}
              />

              <Text style={styles.sliderLabel}>Daily Goal (hours)</Text>
              <Slider
                style={styles.slider}
                minimumValue={60}
                maximumValue={480}
                step={30}
                value={goalMinutes}
                onValueChange={(value) => {
                  setGoalMinutes(value);
                  markDirty();
                }}
                minimumTrackTintColor={ALTASAI_COLORS.accent.DEFAULT}
                maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
                thumbTintColor={ALTASAI_COLORS.accent.DEFAULT}
              />

              <Text style={styles.sliderLabel}>Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="What apps consumed most time?"
                placeholderTextColor={ALTASAI_COLORS.text.tertiary}
                value={notes}
                onChangeText={(text) => {
                  setNotes(text);
                  markDirty();
                }}
                multiline
                maxLength={200}
              />

              <Text style={styles.cortexText}>
                Cortex signal: usage above the daily goal emits a digital behavior event and can increase execution risk.
              </Text>

              <AnimatedButton
                title={isSaved ? 'Saved' : isLoading ? 'Saving...' : 'Save Screen Time'}
                variant={isSaved ? 'secondary' : 'primary'}
                size="lg"
                fullWidth
                onPress={handleSave}
                disabled={isLoading || isSaved}
                style={styles.saveButton}
              />
            </GlassCard>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <View style={styles.statsRow}>
              <GlassCard style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.statEmoji}>ST</Text>
                  {streak > 0 ? <PulseCircle size={8} color={ALTASAI_COLORS.success.DEFAULT} /> : null}
                </View>
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
                <Text style={styles.statSubtext}>Under goal</Text>
              </GlassCard>

              <GlassCard style={styles.statCard}>
                <Text style={styles.statEmoji}>AVG</Text>
                <Text style={styles.statValue}>
                  {Math.floor(weeklyAvg / 60)}h {weeklyAvg % 60}m
                </Text>
                <Text style={styles.statLabel}>Weekly Avg</Text>
                <Text style={styles.statSubtext}>Last 7 days</Text>
              </GlassCard>
            </View>
          </Animated.View>

          {history.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(600).duration(600)}>
              <Text style={styles.sectionTitle}>Last 7 Days</Text>
              <GlassCard style={styles.historyCard}>
                {history.map((usage) => {
                  const date = getUsageDate(usage.date);
                  const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                  const hours = Math.floor(usage.screenMinutes / 60);
                  const minutes = usage.screenMinutes % 60;
                  const wasUnderGoal = !usage.exceeded;

                  return (
                    <View key={usage.id} style={styles.historyItem}>
                      <View style={styles.historyLeft}>
                        <Text style={styles.historyDay}>{day}</Text>
                        <Text style={styles.historyDate}>
                          {date.getDate()}/{date.getMonth() + 1}
                        </Text>
                      </View>
                      <View style={styles.historyRight}>
                        <Text style={[styles.historyTime, !wasUnderGoal && styles.historyTimeOver]}>
                          {hours}h {minutes}m
                        </Text>
                        <Text style={styles.historyStatus}>{wasUnderGoal ? 'Under' : 'Over'}</Text>
                      </View>
                    </View>
                  );
                })}
              </GlassCard>
            </Animated.View>
          ) : null}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
