import React from 'react';
import { View, TouchableOpacity, ViewProps, TouchableOpacityProps } from 'react-native';

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
  className = '',
  ...props
}) => {
  const variantClasses = {
    default: 'bg-surface',
    elevated: 'bg-surface-elevated',
    outline: 'bg-transparent border border-border',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const baseClasses = `rounded-2xl ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

  if (onPress) {
    const touchableProps = props as TouchableOpacityProps;

    return (
      <TouchableOpacity
        className={baseClasses}
        onPress={onPress}
        accessibilityRole="button"
        activeOpacity={0.7}
        {...touchableProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={baseClasses} {...props}>
      {children}
    </View>
  );
};
