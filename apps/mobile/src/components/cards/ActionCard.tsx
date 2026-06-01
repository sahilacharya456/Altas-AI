import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import {
  ALTASAI_COLORS,
  ALTASAI_LAYOUT,
  ALTASAI_RADIUS,
  ALTASAI_SPACING,
  ALTASAI_TYPOGRAPHY,
} from '../../theme';
import { usePressScale } from '../../utils/animations';
import { GlassCard } from '../ui/GlassCard';

interface ActionCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  meta?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ActionCard = ({
  title,
  subtitle,
  icon,
  meta,
  onPress,
  disabled = false,
  style,
}: ActionCardProps) => {
  const { animatedStyle, pressIn, pressOut } = usePressScale();

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={title}
        accessibilityState={{ disabled }}
        disabled={disabled || !onPress}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
      >
        <GlassCard padding="md" style={[styles.card, disabled && styles.disabled]}>
          <View style={styles.row}>
            {icon ? <View style={styles.icon}>{icon}</View> : null}
            <View style={styles.copy}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text numberOfLines={2} style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {meta ? <Text style={styles.meta}>{meta}</Text> : null}
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: ALTASAI_LAYOUT.cardMinHeight,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ALTASAI_SPACING.md,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ALTASAI_RADIUS.lg,
    backgroundColor: ALTASAI_COLORS.surface.strong,
  },
  copy: {
    flex: 1,
  },
  title: {
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
    color: ALTASAI_COLORS.accent.bright,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  disabled: {
    opacity: 0.54,
  },
});
