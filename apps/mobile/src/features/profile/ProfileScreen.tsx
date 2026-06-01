import React from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
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
import { FOCUS_AREAS } from '../../constants/discipline';
import { theme } from '../../theme';
import { styles } from './components/profileStyles';
import { useProfile } from './hooks/useProfile';

export default function ProfileScreen() {
  const {
    user,
    profile,
    disciplineConfig,
    userStats,
    notificationsEnabled,
    setNotificationsEnabled,
    hapticEnabled,
    setHapticEnabled,
    handleLogout,
    showUnavailable,
    goToDisciplineSetup,
    goToSecuritySettings,
  } = useProfile();

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

            <Text style={styles.userName}>{user?.displayName}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>

            {/* Discipline Mode Badge */}
            <View style={[styles.modeBadge, { borderColor: disciplineConfig.color }]}>
              <View style={[styles.modeDot, { backgroundColor: disciplineConfig.color }]} />
              <Text style={[styles.modeText, { color: disciplineConfig.color }]}>
                {disciplineConfig.name} Mode
              </Text>
            </View>
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
                onPress={goToDisciplineSetup}
              />
              <SettingsButton
                icon="UI"
                label="Appearance"
                value="Dark"
                onPress={() => showUnavailable('Appearance')}
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
                onPress={() => showUnavailable('Export Data')}
              />
              <SettingsButton
                icon="AI"
                label="AI memory control"
                onPress={() => showUnavailable('AI memory control')}
              />
              <SettingsButton
                icon="PR"
                label="Terms and privacy"
                onPress={() => showUnavailable('Terms & Privacy')}
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

