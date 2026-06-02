import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';

interface OfflineBannerProps {
  visible: boolean;
}

export const OfflineBanner = ({ visible }: OfflineBannerProps) => {
  if (!visible) return null;

  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.dot} />
      <Text style={styles.text}>Offline — changes will sync when reconnected</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ALTASAI_SPACING.sm,
    paddingHorizontal: ALTASAI_SPACING.md,
    paddingVertical: ALTASAI_SPACING.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.25)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  text: {
    color: '#F59E0B',
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
  },
});
