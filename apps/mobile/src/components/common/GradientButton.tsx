import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import {
  ALTASAI_COLORS,
  ALTASAI_GRADIENTS,
  ALTASAI_LAYOUT,
  ALTASAI_RADIUS,
  ALTASAI_SPACING,
  ALTASAI_TYPOGRAPHY,
} from '../../theme';
import { usePressScale } from '../../utils/animations';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface GradientButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const variantGradients: Record<ButtonVariant, readonly string[]> = {
  primary: ALTASAI_GRADIENTS.primary,
  secondary: ALTASAI_GRADIENTS.secondary,
  ghost: ['transparent', 'transparent'],
  danger: ALTASAI_GRADIENTS.danger,
};

const sizeStyles = {
  sm: { minHeight: ALTASAI_LAYOUT.minTouchTarget, paddingHorizontal: ALTASAI_SPACING.md, fontSize: ALTASAI_TYPOGRAPHY.size.sm },
  md: { minHeight: 50, paddingHorizontal: ALTASAI_SPACING.lg, fontSize: ALTASAI_TYPOGRAPHY.size.base },
  lg: { minHeight: 56, paddingHorizontal: ALTASAI_SPACING.xl, fontSize: ALTASAI_TYPOGRAPHY.size.lg },
};

export const GradientButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  accessibilityLabel,
  style,
}: GradientButtonProps) => {
  const { animatedStyle, pressIn, pressOut } = usePressScale();
  const currentSize = sizeStyles[size];
  const isDisabled = disabled || loading;
  // Primary: emerald bg needs dark text for contrast.
  // Danger: red bg needs white. Secondary/ghost: dark bg needs light text.
  const textColor = variant === 'primary'
    ? ALTASAI_COLORS.background.primary
    : variant === 'danger'
    ? '#FFFFFF'
    : ALTASAI_COLORS.text.primary;

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, animatedStyle, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={({ pressed }) => [isDisabled && styles.disabled, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={variantGradients[variant] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            {
              minHeight: currentSize.minHeight,
              paddingHorizontal: currentSize.paddingHorizontal,
            },
            variant !== 'primary' && styles.outline,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={textColor} />
          ) : (
            <View style={styles.content}>
              {icon ? <View style={styles.icon}>{icon}</View> : null}
              <Text style={[styles.text, { color: textColor, fontSize: currentSize.fontSize }]}>
                {title}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ALTASAI_RADIUS.xl,
    overflow: 'hidden',
  },
  outline: {
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: ALTASAI_SPACING.sm,
  },
  text: {
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    letterSpacing: ALTASAI_TYPOGRAPHY.tracking.normal,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.52,
  },
  pressed: {
    opacity: 0.92,
  },
});
