import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ALTASAI_COLORS, ALTASAI_RADIUS, ALTASAI_SPACING } from '../../theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export const Skeleton = ({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withDelay(200, withTiming(0.7, { duration: 1000 })),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: ALTASAI_COLORS.surface.raised },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const SkeletonCard = ({ style }: { style?: object }) => (
  <View style={[styles.card, style]}>
    <Skeleton width="40%" height={12} />
    <Skeleton width="80%" height={18} style={styles.gap} />
    <Skeleton width="60%" height={12} style={styles.gap} />
  </View>
);

export const SkeletonDashboard = () => (
  <View style={styles.dashboard}>
    <Skeleton width="50%" height={14} />
    <Skeleton width="100%" height={80} borderRadius={16} style={styles.gapLg} />
    <View style={styles.row}>
      <Skeleton width="30%" height={64} borderRadius={12} />
      <Skeleton width="30%" height={64} borderRadius={12} />
      <Skeleton width="30%" height={64} borderRadius={12} />
    </View>
    <Skeleton width="100%" height={100} borderRadius={16} style={styles.gapLg} />
    <Skeleton width="100%" height={100} borderRadius={16} style={styles.gap} />
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: ALTASAI_COLORS.surface.subtle,
    borderRadius: ALTASAI_RADIUS.xl,
    padding: ALTASAI_SPACING.lg,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
  },
  dashboard: {
    gap: ALTASAI_SPACING.sm,
    paddingVertical: ALTASAI_SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ALTASAI_SPACING.sm,
    marginTop: ALTASAI_SPACING.md,
  },
  gap: {
    marginTop: ALTASAI_SPACING.sm,
  },
  gapLg: {
    marginTop: ALTASAI_SPACING.md,
  },
});
