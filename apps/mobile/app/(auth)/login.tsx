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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [showError, setShowError] = useState(false);

  // Let the root navigator handle auth state changes automatically
  // No need for a declarative Redirect here as it can cause race conditions

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      safeImpactAsync(ImpactFeedbackStyle.Medium);
      clearError();
      setShowError(false);
      await login(data.email, data.password);
      safeNotificationAsync(NotificationFeedbackType.Success);
      showToast('Signed in.', 'success');
      router.replace(ROUTES.ROOT);
    } catch (err) {
      safeNotificationAsync(NotificationFeedbackType.Error);
      setShowError(true);
    }
  };

  const handleBack = () => {
    safeImpactAsync(ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleForgotPassword = () => router.push(ROUTES.AUTH.FORGOT_PASSWORD);

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
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Return to your command center.</Text>
            </Animated.View>

            {/* Form Card */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.formCard}>
              {/* Error Message */}
              {showError && error && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              )}

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      accessibilityLabel="Email address"
                      style={[styles.input, errors.email && styles.inputError]}
                      placeholder="name@example.com"
                      placeholderTextColor={ALTASAI_COLORS.text.tertiary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={value}
                      onChangeText={(text) => { onChange(text); setShowError(false); }}
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
                      placeholder="Password"
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

              {/* Submit Button */}
              <Pressable
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Text>
              </Pressable>

              {/* Forgot Password */}
              <Pressable
                style={styles.forgotButton}
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                <Text style={[styles.forgotText, !isLoading && styles.forgotTextActive]}>
                  Forgot password?
                </Text>
              </Pressable>
            </Animated.View>

            {/* Register Link */}
            <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.registerSection}>
              <Text style={styles.registerText}>Don't have an account?</Text>
              <Pressable onPress={() => router.push(ROUTES.AUTH.REGISTER)}>
                <Text style={styles.registerLink}>Create one</Text>
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
    marginTop: ALTASAI_SPACING[6],
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
    marginBottom: ALTASAI_SPACING[5],
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
  forgotButton: {
    alignItems: 'center',
    marginTop: ALTASAI_SPACING[4],
  },
  forgotText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.muted,
  },
  forgotTextActive: {
    color: ALTASAI_COLORS.accent.primary,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ALTASAI_SPACING[8],
    gap: ALTASAI_SPACING[2],
  },
  registerText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.tertiary,
  },
  registerLink: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    color: ALTASAI_COLORS.accent.primary,
  },
});
