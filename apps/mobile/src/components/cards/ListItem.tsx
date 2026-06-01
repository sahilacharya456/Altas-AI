import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { ALTASAI_COLORS, ALTASAI_RADIUS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';

interface ListItemProps {
  title: string;
  subtitle?: string;
  meta?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ListItem = ({ title, subtitle, meta, left, right, onPress, style }: ListItemProps) => (
  <Pressable
    accessibilityRole={onPress ? 'button' : undefined}
    accessibilityLabel={title}
    onPress={onPress}
    disabled={!onPress}
    style={({ pressed }) => [styles.container, pressed && styles.pressed, style]}
  >
    {left ? <View style={styles.left}>{left}</View> : null}
    <View style={styles.body}>
      <View style={styles.titleRow}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      {subtitle ? <Text numberOfLines={2} style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {right ? <View style={styles.right}>{right}</View> : null}
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ALTASAI_SPACING.md,
    padding: ALTASAI_SPACING.md,
    borderRadius: ALTASAI_RADIUS.lg,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.secondary,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
  },
  pressed: {
    opacity: 0.82,
  },
  left: {
    width: 36,
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ALTASAI_SPACING.sm,
  },
  title: {
    flex: 1,
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  subtitle: {
    marginTop: 3,
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
  },
  meta: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
  },
  right: {
    alignItems: 'flex-end',
  },
});
