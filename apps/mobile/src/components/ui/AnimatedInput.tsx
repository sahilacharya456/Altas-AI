import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

interface AnimatedInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  label,
  error,
  icon,
  isPassword = false,
  value,
  onFocus,
  onBlur,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const focusAnim = useSharedValue(0);
  const labelAnim = useSharedValue(value ? 1 : 0);

  const handleFocus = (e: any) => {
    focusAnim.value = withSpring(1, theme.animation.spring.gentle);
    labelAnim.value = withSpring(1, theme.animation.spring.gentle);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    focusAnim.value = withSpring(0, theme.animation.spring.gentle);
    if (!value) {
      labelAnim.value = withSpring(0, theme.animation.spring.gentle);
    }
    onBlur?.(e);
  };

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusAnim.value,
      [0, 1],
      [theme.colors.glass.border, theme.colors.primary.DEFAULT]
    ),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(labelAnim.value, [0, 1], [0, -28]) } as const,
      { scale: interpolate(labelAnim.value, [0, 1], [1, 0.85]) } as const,
    ],
    color: interpolateColor(
      focusAnim.value,
      [0, 1],
      [theme.colors.text.tertiary, theme.colors.primary.light]
    ),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(focusAnim.value, [0, 1], [0, 0.3]),
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Glow effect when focused */}
        <Animated.View
          style={[
            styles.glow,
            { backgroundColor: theme.colors.primary.glow },
            glowStyle,
          ]}
        />

        {/* Background */}
        <LinearGradient
          colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
          style={styles.background}
        />

        {/* Icon */}
        {icon && <View style={styles.icon}>{icon}</View>}

        {/* Input area */}
        <View style={styles.inputWrapper}>
          <Animated.Text style={[styles.label, labelStyle]}>
            {label}
          </Animated.Text>
          <TextInput
            style={styles.input}
            placeholderTextColor="transparent"
            secureTextEntry={isPassword && !showPassword}
            value={value}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
        </View>

        {/* Password toggle */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>
              {showPassword ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
    minHeight: 60,
  },
  glow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: theme.radius.xl + 10,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  icon: {
    paddingLeft: theme.spacing.md,
  },
  inputWrapper: {
    flex: 1,
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing[4],
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    left: theme.spacing[3],
    fontSize: theme.typography.size.base,
    fontWeight: '500',
  },
  input: {
    fontSize: theme.typography.size.base,
    color: theme.colors.text.primary,
    paddingTop: 8,
  },
  toggle: {
    paddingRight: theme.spacing[3],
  },
  toggleText: {
    color: theme.colors.primary.light,
    fontSize: theme.typography.size.sm,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: theme.spacing[1],
    paddingHorizontal: theme.spacing[2],
  },
  errorText: {
    color: theme.colors.error.DEFAULT,
    fontSize: theme.typography.size.sm,
  },
});
