import React from 'react';
import { RefreshControl, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { GradientButton, SectionHeader } from '../../../components/common';
import { ActionCard, CommandCard, InsightCard, InterventionCard, StatCard } from '../../../components/cards';
import { ProgressRing } from '../../../components/charts';
import { DisciplineBadge, EmptyState, ErrorState, RiskBadge } from '../../../components/feedback';
import { AppHeader, ScreenContainer } from '../../../components/layout';
import { AltasAICoreVisual } from '../../../components/ui';
import { ALTASAI_COLORS } from '../../../theme';
import { altasaiCardEntrance } from '../../../utils/animations';
import { HomeStatPill } from '../components/HomeStatPill';
import { styles } from '../components/homeStyles';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { formatTaskTime, getGreeting } from '../utils';

export default function HomeScreen() {
  const {
    profile,
    disciplineConfig,
    topActions,
    summary,
    tasksLoading,
    refreshing,
    interventions,
    commandState,
    quickModules,
    disciplineScore,
    streakDays,
    firstName,
    hasError,
    loadDashboard,
    onRefresh,
    handleNavigation,
    acceptInterventionCard,
    ignoreInterventionCard,
    routes,
  } = useHomeDashboard();

  return (
    <ScreenContainer
      scrollProps={{
        refreshControl: (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ALTASAI_COLORS.accent.bright}
            colors={[ALTASAI_COLORS.accent.bright]}
          />
        ),
      }}
    >
      <Animated.View entering={altasaiCardEntrance(0)}>
        <AppHeader
          eyebrow={new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
          title={`${getGreeting()}, ${firstName}`}
          subtitle="Today's priority, risk level, and one action to avoid."
          right={
            <DisciplineBadge
              mode={profile?.disciplineLevel === 'ruthless' ? 'strict' : profile?.disciplineLevel === 'mentor' ? 'calm' : 'firm'}
              label={`${disciplineConfig.name} mode`}
            />
          }
        />
      </Animated.View>

      {hasError ? (
        <ErrorState
          title="Some signals did not load"
          message={hasError}
          actionLabel="Retry"
          onAction={loadDashboard}
        />
      ) : null}

      <Animated.View entering={altasaiCardEntrance(1)}>
        <CommandCard eyebrow="AltasAI Core" title="Behavior intelligence active.">
          <View style={styles.coreBriefing}>
            <AltasAICoreVisual size={132} label="Daily command signal" />
            <View style={styles.coreCopy}>
              <Text style={styles.coreTitle}>Your execution, analyzed.</Text>
              <Text style={styles.coreText}>
                AltasAI tracks your tasks, focus sessions, and patterns to give you one concrete next move — no guessing.
              </Text>
            </View>
          </View>
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(2)}>
        <View style={styles.statusGrid}>
          <StatCard
            label="Streak"
            value={`${streakDays}d`}
            helper="Discipline status"
            tone={streakDays > 0 ? 'success' : 'warning'}
            trend={streakDays > 0 ? 'Active' : 'Needs start'}
            style={styles.statusCard}
          />
          <StatCard
            label="Mode"
            value={disciplineConfig.name}
            helper="Accountability level"
            tone="info"
            style={styles.statusCard}
          />
        </View>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(3)}>
        <CommandCard
          eyebrow="Daily command briefing"
          title={commandState.topPriority}
          right={<RiskBadge level={commandState.riskLevel} />}
        >
          <View style={styles.briefingBody}>
            <View style={styles.briefingMetric}>
              <Text style={styles.metricLabel}>Execution risk</Text>
              <Text style={styles.metricValue}>{commandState.riskScore}%</Text>
            </View>
            <View style={styles.briefingCopy}>
              <Text style={styles.briefingLabel}>Reason</Text>
              <Text style={styles.briefingText}>{commandState.riskReason}</Text>
              <Text style={styles.briefingLabel}>Suggested action</Text>
              <Text style={styles.briefingText}>{commandState.suggestedAction}</Text>
            </View>
          </View>
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(4)}>
        <CommandCard eyebrow="Discipline score" title="Execution gauge">
          <View style={styles.scoreLayout}>
            <ProgressRing
              progress={Math.max(0, Math.min(1, disciplineScore / 100))}
              size={148}
              strokeWidth={12}
              label="Score"
              gradientColors={[ALTASAI_COLORS.accent.bright, ALTASAI_COLORS.accent.violet]}
            />
            <View style={styles.scoreStats}>
              <HomeStatPill label="Completed" value={`${summary.completed}/${summary.total}`} />
              <HomeStatPill label="Progress" value={`${Math.round(commandState.completionRate * 100)}%`} />
              <HomeStatPill label="Remaining" value={String(commandState.remainingTasks)} />
            </View>
          </View>
        </CommandCard>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(5)}>
        <SectionHeader title="Top 3 actions" subtitle="Ranked by priority, carry debt, and schedule." />
        <View style={styles.actionList}>
          {tasksLoading && topActions.length === 0 ? (
            <Text style={styles.mutedText}>Loading today&apos;s actions...</Text>
          ) : topActions.length > 0 ? (
            topActions.map((task, index) => (
              <ActionCard
                key={task.id ?? `${task.title}-${index}`}
                title={task.title}
                subtitle={`${task.priority.toUpperCase()} priority - ${formatTaskTime(task)}${task.carryCount > 0 ? ` - carried ${task.carryCount}x` : ''}`}
                meta={`#${index + 1}`}
                onPress={() => handleNavigation(routes.TASKS)}
              />
            ))
          ) : (
            <EmptyState
              title="No command actions yet"
              message="Create one task that defines a successful day."
              actionLabel="Add task"
              onAction={() => handleNavigation(routes.TASKS)}
            />
          )}
        </View>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(6)}>
        <SectionHeader
          title="Active interventions"
          subtitle="Proactive cards created from behavior risk rules."
          action={<GradientButton title="All" size="sm" variant="secondary" onPress={() => handleNavigation(routes.INTERVENTIONS)} />}
        />
        <View style={styles.actionList}>
          {interventions.length ? interventions.map((intervention) => (
            <InterventionCard
              key={intervention.id}
              intervention={intervention}
              compact
              onAccept={() => acceptInterventionCard(intervention)}
              onIgnore={() => ignoreInterventionCard(intervention)}
            />
          )) : (
            <Text style={styles.mutedText}>No active interventions. AltasAI will create cards when risk rules trigger.</Text>
          )}
        </View>
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(7)}>
        <InsightCard
          eyebrow="Risk warning"
          title="Avoid the highest-friction failure mode"
          body={commandState.warning}
          risk={commandState.riskLevel}
        />
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(8)}>
        <GradientButton
          title="Start Focus Session"
          onPress={() => handleNavigation(routes.TASKS)}
          size="lg"
          fullWidth
        />
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(9)}>
        <InsightCard
          eyebrow="Cortex preview"
          title="Next useful pattern"
          body={commandState.cortexInsight}
          actionLabel="Open Cortex"
          onAction={() => handleNavigation(routes.CORTEX)}
        />
      </Animated.View>

      <Animated.View entering={altasaiCardEntrance(10)}>
        <SectionHeader title="Quick modules" subtitle="Secondary routes after the daily command is clear." />
        <View style={styles.moduleGrid}>
          {quickModules.map((module) => (
            <ActionCard
              key={module.path}
              title={module.title}
              subtitle={module.subtitle}
              meta={module.code}
              onPress={() => handleNavigation(module.path)}
              style={styles.moduleCard}
            />
          ))}
        </View>
      </Animated.View>
    </ScreenContainer>
  );
}
