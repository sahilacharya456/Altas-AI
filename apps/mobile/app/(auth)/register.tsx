import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { safeImpactAsync, ImpactFeedbackStyle, NotificationFeedbackType, safeNotificationAsync } from '../../src/utils/haptics';
import { useAuthStore } from '../../src/stores/authStore';
import { useToastStore } from '../../src/stores/toastStore';
import { PasswordInput } from '../../src/components/auth/PasswordInput';
import { ALTASAI_COLORS } from '../../src/theme/colors';
import { ALTASAI_TYPOGRAPHY } from '../../src/theme/typography';
import { ALTASAI_SPACING } from '../../src/theme/spacing';
import { ROUTES } from '../../src/constants/routes';

const registerSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Must contain uppercase, lowercase, and number'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { register, isLoading, error, clearError } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [showError, setShowError] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      safeImpactAsync(ImpactFeedbackStyle.Medium);
      clearError();
      setShowError(false);
      await register(data.email, data.password, data.displayName);
      safeNotificationAsync(NotificationFeedbackType.Success);
      showToast('Account created.', 'success');
      // Navigate to root — auth gate will detect onboardingCompleted=false
      // and route to onboarding screen
      setTimeout(() => {
        router.replace(ROUTES.ROOT);
      }, 800);
    } catch (err) {
      safeNotificationAsync(NotificationFeedbackType.Error);
      setShowError(true);
    }
  };

  const handleBack = () => {
    safeImpactAsync(ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back Button */}
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>

            {/* Header */}
            <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Set up the system that will measure your execution.</Text>
            </Animated.View>

            {/* Form Card */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.formCard}>
              {/* Error Message */}
              {showError && error && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <Controller
                  control={control}
                  name="displayName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.displayName && styles.inputError]}
                      placeholder="Your name"
                      placeholderTextColor={ALTASAI_COLORS.text.tertiary}
                      autoCapitalize="words"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.displayName && (
                  <Text style={styles.fieldError}>{errors.displayName.message}</Text>
                )}
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.email && styles.inputError]}
                      placeholder="name@example.com"
                      placeholderTextColor={ALTASAI_COLORS.text.tertiary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.email && (
                  <Text style={styles.fieldError}>{errors.email.message}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PasswordInput
                      hasError={!!errors.password}
                      placeholder="Minimum 8 characters"
                      placeholderTextColor={ALTASAI_COLORS.text.tertiary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.password && (
                  <Text style={styles.fieldError}>{errors.password.message}</Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PasswordInput
                      hasError={!!errors.confirmPassword}
                      placeholder="Re-enter your password"
                      placeholderTextColor={ALTASAI_COLORS.text.tertiary}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.confirmPassword && (
                  <Text style={styles.fieldError}>{errors.confirmPassword.message}</Text>
                )}
              </View>

              {/* Submit Button */}
              <Pressable
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Creating account...' : 'Create account'}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Login Link */}
            <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.loginSection}>
              <Text style={styles.loginText}>Already have an account?</Text>
              <Pressable onPress={() => router.push(ROUTES.AUTH.LOGIN)}>
                <Text style={styles.loginLink}>Sign in</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ALTASAI_COLORS.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ALTASAI_SPACING[6],
    paddingBottom: ALTASAI_SPACING[10],
  },
  backButton: {
    paddingVertical: ALTASAI_SPACING[4],
  },
  backText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    color: ALTASAI_COLORS.accent.primary,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  header: {
    marginTop: ALTASAI_SPACING[4],
    marginBottom: ALTASAI_SPACING[6],
  },
  title: {
    fontSize: ALTASAI_TYPOGRAPHY.size['3xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: ALTASAI_COLORS.text.primary,
    marginBottom: ALTASAI_SPACING[2],
  },
  subtitle: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    color: ALTASAI_COLORS.text.secondary,
    lineHeight: ALTASAI_TYPOGRAPHY.size.base * ALTASAI_TYPOGRAPHY.leading.normal,
  },
  formCard: {
    backgroundColor: ALTASAI_COLORS.background.elevated,
    borderRadius: 24,
    padding: ALTASAI_SPACING[6],
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
  },
  errorBox: {
    backgroundColor: ALTASAI_COLORS.error.glow,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.error.primary,
    borderRadius: 14,
    padding: ALTASAI_SPACING[4],
    marginBottom: ALTASAI_SPACING[5],
  },
  errorText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.error.primary,
  },
  inputGroup: {
    marginBottom: ALTASAI_SPACING[4],
  },
  inputLabel: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    color: ALTASAI_COLORS.text.secondary,
    marginBottom: ALTASAI_SPACING[2],
    letterSpacing: 0,
  },
  input: {
    backgroundColor: ALTASAI_COLORS.background.secondary,
    borderRadius: 14,
    paddingHorizontal: ALTASAI_SPACING[4],
    paddingVertical: ALTASAI_SPACING[4],
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    color: ALTASAI_COLORS.text.primary,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
  },
  inputError: {
    borderColor: ALTASAI_COLORS.error.primary,
  },
  fieldError: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    color: ALTASAI_COLORS.error.primary,
    marginTop: ALTASAI_SPACING[2],
  },
  submitButton: {
    backgroundColor: ALTASAI_COLORS.accent.primary,
    borderRadius: 14,
    paddingVertical: ALTASAI_SPACING[4],
    alignItems: 'center',
    marginTop: ALTASAI_SPACING[2],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: '#FFFFFF',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ALTASAI_SPACING[6],
    gap: ALTASAI_SPACING[2],
  },
  loginText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.tertiary,
  },
  loginLink: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    color: ALTASAI_COLORS.accent.primary,
  },
});
