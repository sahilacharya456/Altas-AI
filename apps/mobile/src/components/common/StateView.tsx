import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ALTASAI_COLORS } from '../../theme/colors';
import { ALTASAI_SPACING } from '../../theme/spacing';
import { ALTASAI_TYPOGRAPHY } from '../../theme/typography';

interface StateViewProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function StateView({ title, message, actionLabel, onAction }: StateViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable style={styles.action} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: ALTASAI_SPACING[6],
  },
  title: {
    fontSize: ALTASAI_TYPOGRAPHY.size.lg,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: ALTASAI_COLORS.text.primary,
    textAlign: 'center',
    marginBottom: ALTASAI_SPACING[2],
  },
  message: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  action: {
    marginTop: ALTASAI_SPACING[5],
    backgroundColor: ALTASAI_COLORS.primary.DEFAULT,
    borderRadius: 12,
    paddingHorizontal: ALTASAI_SPACING[5],
    paddingVertical: ALTASAI_SPACING[3],
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
});
