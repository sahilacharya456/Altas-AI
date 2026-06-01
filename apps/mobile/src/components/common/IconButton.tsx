import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { ALTASAI_COLORS, ALTASAI_LAYOUT, ALTASAI_RADIUS, ALTASAI_TYPOGRAPHY } from '../../theme';
import { usePressScale } from '../../utils/animations';

interface IconButtonProps {
  label: string;
  icon: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const IconButton = ({ label, icon, onPress, disabled = false, style }: IconButtonProps) => {
  const { animatedStyle, pressIn, pressOut } = usePressScale(0.96);

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.button, disabled && styles.disabled]}
      >
        {typeof icon === 'string' ? <Text style={styles.text}>{icon}</Text> : icon}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: ALTASAI_LAYOUT.minTouchTarget,
    height: ALTASAI_LAYOUT.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ALTASAI_RADIUS.full,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
  },
  text: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  disabled: {
    opacity: 0.48,
  },
});
