import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, ScrollView, Pressable, Switch, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { safeSelectionAsync } from '../../utils/haptics';
import {
  GradientBackground,
  GlassCard,
} from '../../components/ui';
import { DISCIPLINE_LEVELS, FOCUS_AREAS, type DisciplineLevel, type FocusArea } from '../../constants/discipline';
import { theme } from '../../theme';
import { styles } from './components/profileStyles';
import { useProfile } from './hooks/useProfile';

export default function ProfileScreen() {
  const {
    user,
    profile,
    disciplineConfig,
    userStats,
    profileCompletion,
    notificationsEnabled,
    setNotificationsEnabled,
    hapticEnabled,
    setHapticEnabled,
    appearanceMode,
    aiMemoryEnabled,
    handleLogout,
    showDisciplineOptions,
    saveProfileChanges,
    showAppearanceOptions,
    goToSecuritySettings,
    exportData,
    showAiMemoryControls,
    showTermsAndPrivacy,
  } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [sleepTime, setSleepTime] = useState('22:00');
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('17:00');
  const [selectedAreas, setSelectedAreas] = useState<FocusArea[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<DisciplineLevel>('strict');

  useEffect(() => {
    setDisplayName(profile?.displayName ?? user?.displayName ?? '');
    setWakeTime(profile?.lifeRhythm?.wakeTime ?? '06:00');
    setSleepTime(profile?.lifeRhythm?.sleepTime ?? '22:00');
    setWorkStartTime(profile?.lifeRhythm?.workStartTime ?? '09:00');
    setWorkEndTime(profile?.lifeRhythm?.workEndTime ?? '17:00');
    setSelectedAreas((profile?.focusAreas ?? []) as FocusArea[]);
    setSelectedLevel(profile?.disciplineLevel ?? 'strict');
  }, [
    profile?.disciplineLevel,
    profile?.displayName,
    profile?.focusAreas,
    profile?.lifeRhythm?.sleepTime,
    profile?.lifeRhythm?.wakeTime,
    profile?.lifeRhythm?.workEndTime,
    profile?.lifeRhythm?.workStartTime,
    user?.displayName,
  ]);

  const toggleArea = (area: FocusArea) => {
    safeSelectionAsync();
    setSelectedAreas((current) =>
      current.includes(area) ? current.filter((item) => item !== area) : [...current, area]
    );
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await saveProfileChanges({
        displayName: displayName.trim() || 'Commander',
        disciplineLevel: selectedLevel,
        focusAreas: selectedAreas.length ? selectedAreas : ['career'],
        lifeRhythm: {
          ...(profile?.lifeRhythm ?? {}),
          wakeTime,
          sleepTime,
          workStartTime,
          workEndTime,
        },
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <GradientBackground variant="mesh">
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <Animated.View
            entering={FadeIn.duration(600)}
            style={styles.header}
          >
            {/* Avatar with glow */}
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarGlow, { backgroundColor: disciplineConfig.color }]} />
              <LinearGradient
                colors={[theme.colors.primary.DEFAULT, theme.colors.accent.DEFAULT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
            </View>

            <Text style={styles.userName}>{profile?.displayName || user?.displayName || 'Commander'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>

            {/* Discipline Mode Badge */}
            <View style={[styles.modeBadge, { borderColor: disciplineConfig.color }]}>
              <View style={[styles.modeDot, { backgroundColor: disciplineConfig.color }]} />
              <Text style={[styles.modeText, { color: disciplineConfig.color }]}>
                {disciplineConfig.name} Mode
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(600)}>
            <Text style={styles.sectionTitle}>Profile Completion</Text>
            <GlassCard style={styles.profileEditCard}>
              <View style={styles.completionHeader}>
                <View>
                  <Text style={styles.completionValue}>{profileCompletion.percent}% complete</Text>
                  <Text style={styles.completionText}>
                    {profileCompletion.complete
                      ? 'Profile is ready for personalized execution guidance.'
                      : `Missing: ${profileCompletion.missing.join(', ')}`}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    safeSelectionAsync();
                    setIsEditing((value) => !value);
                  }}
                  style={styles.editToggleButton}
                >
                  <Text style={styles.editToggleText}>{isEditing ? 'Close' : 'Edit'}</Text>
                </Pressable>
              </View>

              {isEditing ? (
                <ProfileEditForm
                  displayName={displayName}
                  wakeTime={wakeTime}
                  sleepTime={sleepTime}
                  workStartTime={workStartTime}
                  workEndTime={workEndTime}
                  selectedAreas={selectedAreas}
                  selectedLevel={selectedLevel}
                  isSaving={isSaving}
                  onDisplayNameChange={setDisplayName}
                  onWakeTimeChange={setWakeTime}
                  onSleepTimeChange={setSleepTime}
                  onWorkStartChange={setWorkStartTime}
                  onWorkEndChange={setWorkEndTime}
                  onToggleArea={toggleArea}
                  onLevelChange={setSelectedLevel}
                  onCancel={() => setIsEditing(false)}
                  onSave={handleSaveProfile}
                />
              ) : null}
            </GlassCard>
          </Animated.View>

          {/* Quick Stats */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            style={styles.statsRow}
          >
            <GlassCard style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.joinedDays}</Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </GlassCard>
            <GlassCard style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.focusMinutes}</Text>
              <Text style={styles.statLabel}>Focus Mins</Text>
            </GlassCard>
            <GlassCard style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.productivityScore}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </GlassCard>
            <GlassCard style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.streak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </GlassCard>
          </Animated.View>

          {/* Focus Areas */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <Text style={styles.sectionTitle}>Focus Areas</Text>
            <GlassCard style={styles.focusAreasCard}>
              <View style={styles.focusAreasGrid}>
                {profile?.focusAreas?.map((area) => {
                  const areaConfig = FOCUS_AREAS[area];
                  return (
                    <View key={area} style={styles.focusAreaItem}>
                      <Text style={styles.focusAreaIcon}>{areaConfig?.icon}</Text>
                      <Text style={styles.focusAreaName}>{areaConfig?.name}</Text>
                    </View>
                  );
                })}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Life Rhythm */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)}>
            <Text style={styles.sectionTitle}>Life Rhythm</Text>
            <GlassCard style={styles.rhythmCard}>
              <View style={styles.rhythmGrid}>
                <RhythmItem
                  icon="AM"
                  label="Wake Up"
                  value={profile?.lifeRhythm?.wakeTime || '06:00'}
                />
                <RhythmItem
                  icon="PM"
                  label="Sleep"
                  value={profile?.lifeRhythm?.sleepTime || '22:00'}
                />
                <RhythmItem
                  icon="FS"
                  label="Focus Start"
                  value={profile?.lifeRhythm?.workStartTime || '09:00'}
                />
                <RhythmItem
                  icon="FE"
                  label="Focus End"
                  value={profile?.lifeRhythm?.workEndTime || '17:00'}
                />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Settings */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)}>
            <Text style={styles.sectionTitle}>Settings</Text>

            <View style={styles.settingsGroup}>
              <SettingToggle
                icon="NO"
                label="Notifications"
                description="Daily command reminders and intervention alerts"
                value={notificationsEnabled}
                onToggle={setNotificationsEnabled}
              />
              <SettingToggle
                icon="HT"
                label="Haptics"
                description="Subtle feedback on key actions"
                value={hapticEnabled}
                onToggle={setHapticEnabled}
              />
            </View>

            <View style={styles.settingsGroup}>
              <SettingsButton
                icon="DM"
                label="Discipline Level"
                value={disciplineConfig.name}
                valueColor={disciplineConfig.color}
                onPress={showDisciplineOptions}
              />
              <SettingsButton
                icon="UI"
                label="Appearance"
                value={appearanceMode}
                onPress={showAppearanceOptions}
              />
              <SettingsButton
                icon="SC"
                label="Security settings"
                onPress={goToSecuritySettings}
              />
            </View>

            <View style={styles.settingsGroup}>
              <SettingsButton
                icon="EX"
                label="Export data"
                onPress={exportData}
              />
              <SettingsButton
                icon="AI"
                label="AI memory control"
                value={aiMemoryEnabled ? 'On' : 'Off'}
                onPress={showAiMemoryControls}
              />
              <SettingsButton
                icon="PR"
                label="Terms and privacy"
                onPress={showTermsAndPrivacy}
              />
            </View>
          </Animated.View>

          {/* Logout */}
          <Animated.View
            entering={FadeInUp.delay(600).duration(600)}
            style={styles.logoutSection}
          >
            <Pressable onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Log Out</Text>
            </Pressable>

            <Text style={styles.version}>AltasAI v1.0.0</Text>
            <Text style={styles.buildInfo}>Build 2026.05.28</Text>
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

interface RhythmItemProps {
  icon: string;
  label: string;
  value: string;
}

interface ProfileEditFormProps {
  displayName: string;
  wakeTime: string;
  sleepTime: string;
  workStartTime: string;
  workEndTime: string;
  selectedAreas: FocusArea[];
  selectedLevel: DisciplineLevel;
  isSaving: boolean;
  onDisplayNameChange: (value: string) => void;
  onWakeTimeChange: (value: string) => void;
  onSleepTimeChange: (value: string) => void;
  onWorkStartChange: (value: string) => void;
  onWorkEndChange: (value: string) => void;
  onToggleArea: (area: FocusArea) => void;
  onLevelChange: (level: DisciplineLevel) => void;
  onCancel: () => void;
  onSave: () => void;
}

function ProfileEditForm({
  displayName,
  wakeTime,
  sleepTime,
  workStartTime,
  workEndTime,
  selectedAreas,
  selectedLevel,
  isSaving,
  onDisplayNameChange,
  onWakeTimeChange,
  onSleepTimeChange,
  onWorkStartChange,
  onWorkEndChange,
  onToggleArea,
  onLevelChange,
  onCancel,
  onSave,
}: ProfileEditFormProps) {
  return (
    <View style={styles.editForm}>
      <View style={styles.editField}>
        <Text style={styles.editLabel}>Display name</Text>
        <TextInput
          value={displayName}
          onChangeText={onDisplayNameChange}
          placeholder="Commander"
          placeholderTextColor={theme.colors.text.tertiary}
          style={styles.editInput}
        />
      </View>

      <View style={styles.editField}>
        <Text style={styles.editLabel}>Mentor mode</Text>
        <View style={styles.choiceRow}>
          {(Object.keys(DISCIPLINE_LEVELS) as DisciplineLevel[]).map((level) => {
            const config = DISCIPLINE_LEVELS[level];
            const active = selectedLevel === level;
            return (
              <Pressable
                key={level}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onLevelChange(level)}
                style={[styles.choiceChip, active && { borderColor: config.color, backgroundColor: `${config.color}22` }]}
              >
                <Text style={[styles.choiceText, active && { color: config.color }]}>{config.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.editField}>
        <Text style={styles.editLabel}>Focus areas</Text>
        <View style={styles.choiceRow}>
          {(Object.keys(FOCUS_AREAS) as FocusArea[]).map((area) => {
            const config = FOCUS_AREAS[area];
            const active = selectedAreas.includes(area);
            return (
              <Pressable
                key={area}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onToggleArea(area)}
                style={[styles.choiceChip, active && styles.choiceChipActive]}
              >
                <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{config.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.timeGrid}>
        <ProfileTimeInput label="Wake" value={wakeTime} onChange={onWakeTimeChange} />
        <ProfileTimeInput label="Sleep" value={sleepTime} onChange={onSleepTimeChange} />
        <ProfileTimeInput label="Focus start" value={workStartTime} onChange={onWorkStartChange} />
        <ProfileTimeInput label="Focus end" value={workEndTime} onChange={onWorkEndChange} />
      </View>

      <View style={styles.editActions}>
        <Pressable accessibilityRole="button" onPress={onCancel} disabled={isSaving} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onSave} disabled={isSaving} style={styles.saveButton}>
          {isSaving ? <ActivityIndicator color="#061018" /> : <Text style={styles.saveText}>Save profile</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function ProfileTimeInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.timeInputGroup}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="09:00"
        placeholderTextColor={theme.colors.text.tertiary}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        style={styles.editInput}
      />
    </View>
  );
}

function RhythmItem({ icon, label, value }: RhythmItemProps) {
  const formatTime = (time: string): string => {
    const [h, m] = time.split(':').map(Number);
    const hour = h ?? 0;
    const minute = m ?? 0;
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <View style={styles.rhythmItem}>
      <Text style={styles.rhythmIcon}>{icon}</Text>
      <Text style={styles.rhythmLabel}>{label}</Text>
      <Text style={styles.rhythmValue}>{formatTime(value)}</Text>
    </View>
  );
}

interface SettingToggleProps {
  icon: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

function SettingToggle({ icon, label, description, value, onToggle }: SettingToggleProps) {
  return (
    <View style={styles.settingItem}>
      <View style={styles.settingIconContainer}>
        <Text style={styles.settingIcon}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => {
          safeSelectionAsync();
          onToggle(newValue);
        }}
        trackColor={{
          false: 'rgba(255, 255, 255, 0.1)',
          true: theme.colors.primary.DEFAULT,
        }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

interface SettingsButtonProps {
  icon: string;
  label: string;
  value?: string;
  valueColor?: string;
  onPress: () => void;
}

function SettingsButton({ icon, label, value, valueColor, onPress }: SettingsButtonProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, theme.animation.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, theme.animation.spring.gentle);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={() => {
        safeSelectionAsync();
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.settingItem, animatedStyle]}>
        <View style={styles.settingIconContainer}>
          <Text style={styles.settingIcon}>{icon}</Text>
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingLabel}>{label}</Text>
        </View>
        {value && (
          <Text style={[styles.settingValue, valueColor && { color: valueColor }]}>
            {value}
          </Text>
        )}
        <Text style={styles.settingArrow}>{'>'}</Text>
      </Animated.View>
    </Pressable>
  );
}

