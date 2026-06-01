import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY, ALTASAI_RADIUS } from '../../theme';

interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  height?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'error' | 'accent';
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showPercentage = false,
  height = 'md',
  color = 'primary',
  label,
}) => {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const percentage = Math.round(clampedProgress * 100);

  const heightStyle = heightStyles[height];
  const barColor = colorMap[color];

  return (
    <View style={styles.container}>
      {(label || showPercentage) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.labelText}>{label}</Text>}
          {showPercentage && <Text style={styles.labelText}>{percentage}%</Text>}
        </View>
      )}

      <View style={[styles.track, heightStyle]}>
        <View
          style={[styles.fill, heightStyle, { width: `${percentage}%`, backgroundColor: barColor }]}
        />
      </View>
    </View>
  );
};

const colorMap: Record<string, string> = {
  primary: ALTASAI_COLORS.accent.primary,
  success: ALTASAI_COLORS.success.primary,
  warning: ALTASAI_COLORS.warning.primary,
  error: ALTASAI_COLORS.error.primary,
  accent: ALTASAI_COLORS.accent.bright,
};

const heightStyles: Record<string, ViewStyle> = {
  sm: { height: 4 },
  md: { height: 8 },
  lg: { height: 12 },
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ALTASAI_SPACING[2],
  },
  labelText: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
  },
  track: {
    width: '100%',
    backgroundColor: ALTASAI_COLORS.surface.raised,
    borderRadius: ALTASAI_RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: ALTASAI_RADIUS.full,
  },
});
