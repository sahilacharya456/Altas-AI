import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY, ALTASAI_RADIUS } from '../../theme';

interface Props {
  children: ReactNode;
  section?: string;
}

interface State {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) console.warn(`[SectionErrorBoundary:${this.props.section}]`, error.message);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>
            {this.props.section ? `${this.props.section} failed to render` : 'Section error'}
          </Text>
          <Pressable style={styles.retry} onPress={this.handleReset}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: ALTASAI_COLORS.surface.subtle,
    borderRadius: ALTASAI_RADIUS.xl,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    padding: ALTASAI_SPACING.lg,
    alignItems: 'center',
    gap: ALTASAI_SPACING.sm,
  },
  title: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    textAlign: 'center',
  },
  retry: {
    paddingHorizontal: ALTASAI_SPACING.md,
    paddingVertical: ALTASAI_SPACING.xs,
    borderRadius: ALTASAI_RADIUS.md,
    backgroundColor: ALTASAI_COLORS.surface.raised,
  },
  retryText: {
    color: ALTASAI_COLORS.accent.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
});
