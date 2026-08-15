/**
 * Top-level React Error Boundary.
 * Catches any render-phase exception and shows a graceful recovery screen
 * instead of a blank white crash screen.
 */

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY, ALTASAI_RADIUS } from '../theme';

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI. */
  fallback?: (reset: () => void, error: Error) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console in dev; swap for Sentry.captureException in production.
    if (__DEV__) {
      console.error('[ErrorBoundary] Uncaught render error:', error, info.componentStack);
    }
    // TODO: Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (!hasError || !error) return children;

    if (fallback) return fallback(this.handleReset, error);

    return (
      <View style={styles.container}>
        <Text style={styles.icon}>⚡</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>
          AltasAI hit an unexpected error. Your data is safe.
        </Text>
        {__DEV__ && (
          <Text style={styles.devMessage} numberOfLines={4}>
            {error.message}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry"
          style={styles.button}
          onPress={this.handleReset}
        >
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ALTASAI_COLORS.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: ALTASAI_SPACING.xl,
  },
  icon: {
    fontSize: 64,
    marginBottom: ALTASAI_SPACING.lg,
  },
  title: {
    fontSize: ALTASAI_TYPOGRAPHY.size['2xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: ALTASAI_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: ALTASAI_SPACING.md,
  },
  message: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    color: ALTASAI_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: ALTASAI_TYPOGRAPHY.size.base * ALTASAI_TYPOGRAPHY.leading.normal,
    marginBottom: ALTASAI_SPACING.xl,
  },
  devMessage: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    color: ALTASAI_COLORS.error.primary,
    fontFamily: 'monospace',
    backgroundColor: ALTASAI_COLORS.error.glow,
    borderRadius: ALTASAI_RADIUS.md,
    padding: ALTASAI_SPACING.md,
    marginBottom: ALTASAI_SPACING.xl,
    width: '100%',
  },
  button: {
    backgroundColor: ALTASAI_COLORS.accent.primary,
    borderRadius: ALTASAI_RADIUS.lg,
    paddingHorizontal: ALTASAI_SPACING.xl,
    paddingVertical: ALTASAI_SPACING.md,
  },
  buttonText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: '#FFFFFF',
  },
});
