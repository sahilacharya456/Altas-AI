import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { z } from 'zod';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { ROUTES } from '../../src/constants/routes';
import { useAuthStore } from '../../src/stores/authStore';
import { useToastStore } from '../../src/stores/toastStore';
import { ALTASAI_COLORS } from '../../src/theme/colors';
import { ALTASAI_SPACING } from '../../src/theme/spacing';
import { ALTASAI_TYPOGRAPHY } from '../../src/theme/typography';

const emailSchema = z.string().trim().email('Enter a valid email address.');

export default function ForgotPasswordScreen() {
  const { requestPasswordReset, isLoading, error, clearError } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async () => {
    clearError();
    setFieldError(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Enter a valid email address.');
      return;
    }

    try {
      await requestPasswordReset(parsed.data);
      setSentTo(parsed.data);
      showToast('Password reset email sent.', 'success');
    } catch {
      showToast('Could not send reset email.', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={22} color={ALTASAI_COLORS.text.primary} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>

            <Animated.View entering={FadeIn.duration(450)} style={styles.header}>
              <View style={styles.iconShell}>
                <Ionicons name="mail" size={26} color={ALTASAI_COLORS.accent.bright} />
              </View>
              <Text style={styles.title}>Reset password</Text>
              <Text style={styles.subtitle}>Enter your account email. Firebase will send a secure reset link to your inbox.</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).duration(450)} style={styles.panel}>
              {sentTo ? (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={22} color={ALTASAI_COLORS.success.light} />
                  <View style={styles.successCopy}>
                    <Text style={styles.successTitle}>Reset email sent</Text>
                    <Text style={styles.successText}>Check {sentTo}. Follow the link, then return to sign in.</Text>
                  </View>
                </View>
              ) : null}

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                accessibilityLabel="Password reset email"
                style={[styles.input, fieldError && styles.inputError]}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setFieldError(null);
                  clearError();
                }}
                placeholder="name@example.com"
                placeholderTextColor={ALTASAI_COLORS.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {fieldError ? <Text style={styles.fieldError}>{fieldError}</Text> : null}

              <Pressable disabled={isLoading} onPress={handleSubmit} style={[styles.submitButton, isLoading && styles.disabledButton]}>
                <Text style={styles.submitText}>{isLoading ? 'Sending reset link...' : 'Send reset link'}</Text>
              </Pressable>

              <Pressable onPress={() => router.replace(ROUTES.AUTH.LOGIN)} style={styles.loginButton}>
                <Text style={styles.loginText}>Return to sign in</Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ALTASAI_COLORS.background.primary },
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: ALTASAI_SPACING[6], paddingBottom: ALTASAI_SPACING[10] },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: ALTASAI_SPACING[2], paddingVertical: ALTASAI_SPACING[4] },
  backText: { color: ALTASAI_COLORS.text.primary, fontSize: ALTASAI_TYPOGRAPHY.size.sm, fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold },
  header: { marginTop: ALTASAI_SPACING[6], marginBottom: ALTASAI_SPACING[6] },
  iconShell: {
    width: 54,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56,189,248,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.24)',
    marginBottom: ALTASAI_SPACING[4],
  },
  title: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size['3xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    letterSpacing: 0,
  },
  subtitle: { color: ALTASAI_COLORS.text.secondary, fontSize: ALTASAI_TYPOGRAPHY.size.base, lineHeight: 23, marginTop: ALTASAI_SPACING[2] },
  panel: {
    backgroundColor: ALTASAI_COLORS.background.elevated,
    borderRadius: 8,
    padding: ALTASAI_SPACING[5],
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
  },
  successBox: {
    flexDirection: 'row',
    gap: ALTASAI_SPACING[3],
    padding: ALTASAI_SPACING[4],
    borderRadius: 8,
    backgroundColor: 'rgba(16,185,129,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.24)',
    marginBottom: ALTASAI_SPACING[4],
  },
  successCopy: { flex: 1 },
  successTitle: { color: ALTASAI_COLORS.success.light, fontSize: ALTASAI_TYPOGRAPHY.size.sm, fontWeight: ALTASAI_TYPOGRAPHY.weight.bold },
  successText: { color: ALTASAI_COLORS.text.secondary, fontSize: ALTASAI_TYPOGRAPHY.size.sm, lineHeight: 20, marginTop: 2 },
  errorBox: {
    padding: ALTASAI_SPACING[4],
    borderRadius: 8,
    backgroundColor: ALTASAI_COLORS.error.glow,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.error.primary,
    marginBottom: ALTASAI_SPACING[4],
  },
  errorText: { color: ALTASAI_COLORS.error.primary, fontSize: ALTASAI_TYPOGRAPHY.size.sm },
  inputLabel: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    marginBottom: ALTASAI_SPACING[2],
  },
  input: {
    minHeight: 52,
    borderRadius: 8,
    paddingHorizontal: ALTASAI_SPACING[4],
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    backgroundColor: ALTASAI_COLORS.background.secondary,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
  },
  inputError: { borderColor: ALTASAI_COLORS.error.primary },
  fieldError: { color: ALTASAI_COLORS.error.primary, fontSize: ALTASAI_TYPOGRAPHY.size.xs, marginTop: ALTASAI_SPACING[2] },
  submitButton: {
    minHeight: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ALTASAI_COLORS.accent.primary,
    marginTop: ALTASAI_SPACING[5],
  },
  disabledButton: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: ALTASAI_TYPOGRAPHY.size.base, fontWeight: ALTASAI_TYPOGRAPHY.weight.bold },
  loginButton: { alignItems: 'center', paddingVertical: ALTASAI_SPACING[4] },
  loginText: { color: ALTASAI_COLORS.accent.primary, fontSize: ALTASAI_TYPOGRAPHY.size.sm, fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold },
});
