import { Redirect, Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ALTASAI_COLORS } from '../../src/theme/colors';
import { useAuthStore } from '../../src/stores/authStore';
import { LoadingState, OfflineBanner } from '../../src/components/feedback';
import { useNetworkStatus } from '../../src/hooks';

interface TabIconProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
}

function TabIcon({ icon, label, focused }: TabIconProps) {
  const scale = useSharedValue(focused ? 1 : 0.9);
  const opacity = useSharedValue(focused ? 1 : 0.5);

  scale.value = withSpring(focused ? 1 : 0.9, { damping: 15, stiffness: 300 });
  opacity.value = withTiming(focused ? 1 : 0.5, { duration: 200 });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.tabIcon, animatedStyle]}>
      <Ionicons
        name={icon}
        size={22}
        color={focused ? ALTASAI_COLORS.primary.light : ALTASAI_COLORS.text.secondary}
        accessibilityLabel={`${label} tab icon`}
      />
      <Text style={[styles.labelText, focused && styles.labelTextFocused]}>
        {label}
      </Text>
      {focused && <View style={styles.focusIndicator} />}
    </Animated.View>
  );
}

export default function MainLayout() {
  const { isInitialized, isAuthenticated, isLoading, profile } = useAuthStore();
  const network = useNetworkStatus();
  const isOffline = !network.isConnected || !network.isInternetReachable;

  if (!isInitialized || isLoading) {
    return <LoadingState title="Preparing AltasAI" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (!profile || !profile.onboardingCompleted) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <View style={styles.layoutRoot}>
      <OfflineBanner visible={isOffline} />
      <Tabs
        screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarShowLabel: false,
        tabBarActiveTintColor: ALTASAI_COLORS.primary.DEFAULT,
        tabBarInactiveTintColor: ALTASAI_COLORS.text.tertiary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={focused ? 'grid' : 'grid-outline'} label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={focused ? 'checkbox' : 'checkbox-outline'} label="Tasks" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={focused ? 'flag' : 'flag-outline'} label="Goals" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="mentor"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={focused ? 'sparkles' : 'sparkles-outline'} label="Mentor" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={focused ? 'person-circle' : 'person-circle-outline'} label="Profile" focused={focused} />
          ),
        }}
      />

      <Tabs.Screen name="digital" options={{ href: null }} />
      <Tabs.Screen name="health" options={{ href: null }} />
      <Tabs.Screen name="khata" options={{ href: null }} />
      <Tabs.Screen name="security" options={{ href: null }} />
      <Tabs.Screen name="reflection" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="cortex" options={{ href: null }} />
      <Tabs.Screen name="behavior-timeline" options={{ href: null }} />
      <Tabs.Screen name="interventions" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="daily-report" options={{ href: null }} />
      <Tabs.Screen name="weekly-report" options={{ href: null }} />
      <Tabs.Screen name="news" options={{ href: null }} />
      <Tabs.Screen name="scan-link" options={{ href: null }} />
      <Tabs.Screen name="device-safety" options={{ href: null }} />
      <Tabs.Screen name="add-expense" options={{ href: null }} />
      <Tabs.Screen name="expense-history" options={{ href: null }} />
      <Tabs.Screen name="ledger" options={{ href: null }} />
      <Tabs.Screen name="budget-insights" options={{ href: null }} />
      <Tabs.Screen name="task-detail" options={{ href: null }} />
      <Tabs.Screen name="focus" options={{ href: null }} />
    </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  layoutRoot: {
    flex: 1,
    backgroundColor: ALTASAI_COLORS.background.primary,
  },
  tabBar: {
    position: 'absolute',
    backgroundColor: ALTASAI_COLORS.background.secondary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    height: Platform.OS === 'ios' ? 88 : 70,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 10,
    elevation: 0,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '500',
    color: ALTASAI_COLORS.text.secondary,
    marginTop: 4,
    letterSpacing: 0,
  },
  labelTextFocused: {
    color: ALTASAI_COLORS.primary.light,
    fontWeight: '600',
  },
  focusIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ALTASAI_COLORS.primary.DEFAULT,
  },
});
