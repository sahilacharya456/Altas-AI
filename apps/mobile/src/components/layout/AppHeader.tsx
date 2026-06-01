import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { router } from 'expo-router';

import {
  ALTASAI_COLORS,
  ALTASAI_LAYOUT,
  ALTASAI_RADIUS,
  ALTASAI_SPACING,
  ALTASAI_TYPOGRAPHY,
} from '../../theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const AppHeader = ({
  title,
  subtitle,
  eyebrow,
  left,
  right,
  showBack = false,
  onBack,
  style,
}: AppHeaderProps) => (
  <View style={[styles.container, style]}>
    <View style={styles.leftCluster}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack ?? router.back}
          hitSlop={8}
          style={styles.backButton}
        >
          <Text style={styles.backText} accessibilityElementsHidden>←</Text>
        </Pressable>
      ) : left}
      <View style={styles.titleBlock}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={2} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
    {right ? <View style={styles.right}>{right}</View> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    minHeight: ALTASAI_LAYOUT.headerMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ALTASAI_SPACING.md,
  },
  leftCluster: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ALTASAI_SPACING.sm,
  },
  titleBlock: {
    flex: 1,
  },
  eyebrow: {
    color: ALTASAI_COLORS.accent.bright,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    letterSpacing: ALTASAI_TYPOGRAPHY.tracking.wider,
    textTransform: 'uppercase',
  },
  title: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size['2xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    letterSpacing: ALTASAI_TYPOGRAPHY.tracking.tight,
  },
  subtitle: {
    marginTop: 2,
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
  },
  backButton: {
    width: ALTASAI_LAYOUT.minTouchTarget,
    height: ALTASAI_LAYOUT.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ALTASAI_RADIUS.full,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
  },
  backText: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xl,
    lineHeight: ALTASAI_TYPOGRAPHY.size.xl * 1.2,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
  },
  right: {
    alignItems: 'flex-end',
  },
});
