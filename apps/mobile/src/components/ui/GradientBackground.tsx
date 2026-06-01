import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ALTASAI_COLORS } from '../../theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../theme/typography';
import { ALTASAI_SPACING } from '../../theme/spacing';
const theme = { colors: ALTASAI_COLORS, typography: ALTASAI_TYPOGRAPHY, spacing: ALTASAI_SPACING };

interface GradientBackgroundProps {
  variant?: 'default' | 'subtle' | 'intense' | 'mesh';
  animated?: boolean;
  children?: React.ReactNode;
}

type GradientBackgroundVariant = NonNullable<GradientBackgroundProps['variant']>;
type GradientColorSet = readonly [string, string, ...string[]];

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  variant = 'default',
  animated: _animated = false,
  children,
}) => {
  const gradientColors: Record<GradientBackgroundVariant, GradientColorSet> = {
    default: [
      theme.colors.background.primary,
      theme.colors.background.secondary,
      theme.colors.background.tertiary,
    ],
    subtle: [
      theme.colors.background.primary,
      theme.colors.background.primary,
      theme.colors.background.secondary,
    ],
    intense: [
      theme.colors.background.primary,
      theme.colors.background.secondary,
      theme.colors.background.elevated,
    ],
    mesh: [
      theme.colors.background.primary,
      theme.colors.background.secondary,
      theme.colors.background.tertiary,
      theme.colors.background.elevated,
    ],
  };

  return (
    <View style={styles.container}>
      {/* Base gradient */}
      <LinearGradient
        colors={gradientColors[variant] || gradientColors.default}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.gridOverlay} />

      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: 'absolute',
  },
  orb1: {
    top: -100,
    right: -100,
  },
  orb2: {
    bottom: 100,
    left: -80,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.02,
    // Would add a subtle grid pattern here
  },
});
