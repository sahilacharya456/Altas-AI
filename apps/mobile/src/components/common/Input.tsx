import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  isPassword = false,
  style,
  placeholderTextColor = ALTASAI_COLORS.text.tertiary,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const borderColor = error
    ? 'border-error'
    : isFocused
    ? 'border-primary'
    : 'border-border';

  return (
    <View className="w-full">
      {label && (
        <Text className="text-text-secondary text-sm mb-2 font-medium">
          {label}
        </Text>
      )}

      <View
        className={`flex-row items-center bg-surface rounded-xl border ${borderColor} px-4`}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}

        <TextInput
          className="flex-1 text-text py-4 text-base"
          style={[styles.input, style]}
          placeholderTextColor={placeholderTextColor}
          selectionColor={ALTASAI_COLORS.accent.bright}
          cursorColor={ALTASAI_COLORS.accent.bright}
          secureTextEntry={isPassword && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            className="ml-3"
          >
            <Text className="text-text-secondary text-sm">
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && <View className="ml-3">{rightIcon}</View>}
      </View>

      {error && (
        <Text className="text-error text-sm mt-1">{error}</Text>
      )}

      {hint && !error && (
        <Text className="text-text-tertiary text-sm mt-1">{hint}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    flex: 1,
    paddingVertical: ALTASAI_SPACING[4],
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    color: ALTASAI_COLORS.text.primary,
  },
});
