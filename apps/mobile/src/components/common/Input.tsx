import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY, ALTASAI_RADIUS } from '../../theme';

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

  const borderStyle: ViewStyle = error
    ? { borderColor: ALTASAI_COLORS.error.primary }
    : isFocused
    ? { borderColor: ALTASAI_COLORS.accent.primary }
    : { borderColor: ALTASAI_COLORS.border.primary };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      <View style={[styles.inputRow, borderStyle]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
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
            style={styles.rightIcon}
          >
            <Text style={styles.toggleText}>
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {hint && !error && (
        <Text style={styles.hintText}>{hint}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    marginBottom: ALTASAI_SPACING[2],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ALTASAI_COLORS.surface.base,
    borderRadius: ALTASAI_RADIUS.xl,
    borderWidth: 1,
    paddingHorizontal: ALTASAI_SPACING[4],
  },
  leftIcon: {
    marginRight: ALTASAI_SPACING[3],
  },
  rightIcon: {
    marginLeft: ALTASAI_SPACING[3],
  },
  input: {
    flex: 1,
    paddingVertical: ALTASAI_SPACING[4],
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    color: ALTASAI_COLORS.text.primary,
  },
  toggleText: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
  },
  errorText: {
    color: ALTASAI_COLORS.error.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    marginTop: ALTASAI_SPACING[1],
  },
  hintText: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    marginTop: ALTASAI_SPACING[1],
  },
});
