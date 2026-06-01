import React from 'react';
import { View, TouchableOpacity, ViewProps, TouchableOpacityProps, StyleSheet, ViewStyle } from 'react-native';
import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_RADIUS } from '../../theme';

type CardProps = ViewProps & {
  variant?: 'default' | 'elevated' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: TouchableOpacityProps['onPress'];
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  style,
  ...props
}) => {
  const variantStyle = variantStyles[variant];
  const paddingStyle = paddingStyles[padding];
  const combined: ViewStyle[] = [styles.base, variantStyle, paddingStyle, style as ViewStyle];

  if (onPress) {
    return (
      <TouchableOpacity
        style={combined}
        onPress={onPress}
        accessibilityRole="button"
        activeOpacity={0.7}
        {...(props as TouchableOpacityProps)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={combined} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: ALTASAI_RADIUS['2xl'],
  },
});

const variantStyles: Record<string, ViewStyle> = {
  default: {
    backgroundColor: ALTASAI_COLORS.surface.base,
  },
  elevated: {
    backgroundColor: ALTASAI_COLORS.surface.raised,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.secondary,
  },
};

const paddingStyles: Record<string, ViewStyle> = {
  none: {},
  sm: { padding: ALTASAI_SPACING[3] },
  md: { padding: ALTASAI_SPACING[4] },
  lg: { padding: ALTASAI_SPACING[6] },
};
