import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ALTASAI_COLORS, ALTASAI_RADIUS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';
import { safeImpactAsync, ImpactFeedbackStyle } from '../../utils/haptics';

interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const bgColor: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: ALTASAI_COLORS.accent.primary,
  secondary: ALTASAI_COLORS.surface.raised,
  outline: 'transparent',
  ghost: 'transparent',
  danger: ALTASAI_COLORS.error.primary,
};

const textColor: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: ALTASAI_COLORS.background.primary,
  secondary: ALTASAI_COLORS.text.primary,
  outline: ALTASAI_COLORS.accent.primary,
  ghost: ALTASAI_COLORS.accent.primary,
  danger: '#FFFFFF',
};

const paddingH: Record<NonNullable<ButtonProps['size']>, number> = {
  sm: ALTASAI_SPACING.md,
  md: ALTASAI_SPACING.lg,
  lg: ALTASAI_SPACING.xl,
};

const minH: Record<NonNullable<ButtonProps['size']>, number> = {
  sm: 36,
  md: 48,
  lg: 56,
};

const fontSize: Record<NonNullable<ButtonProps['size']>, number> = {
  sm: ALTASAI_TYPOGRAPHY.size.sm,
  md: ALTASAI_TYPOGRAPHY.size.base,
  lg: ALTASAI_TYPOGRAPHY.size.lg,
};

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  style,
}) => {
  const isDisabled = disabled || isLoading;

  const handlePress = () => {
    if (!isDisabled) {
      if (Platform.OS !== 'web') safeImpactAsync(ImpactFeedbackStyle.Light);
      onPress?.();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColor[variant],
          paddingHorizontal: paddingH[size],
          minHeight: minH[size],
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: variant === 'outline' ? ALTASAI_COLORS.accent.primary : undefined,
          width: fullWidth ? '100%' : undefined,
          opacity: isDisabled ? 0.52 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={textColor[variant]} size="small" />
      ) : (
        <View style={styles.row}>
          {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
          <Text
            style={[
              styles.text,
              { color: textColor[variant], fontSize: fontSize[size] },
            ]}
          >
            {title}
          </Text>
          {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ALTASAI_RADIUS.xl,
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    letterSpacing: ALTASAI_TYPOGRAPHY.tracking.normal,
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: ALTASAI_SPACING.sm,
  },
  iconRight: {
    marginLeft: ALTASAI_SPACING.sm,
  },
});
