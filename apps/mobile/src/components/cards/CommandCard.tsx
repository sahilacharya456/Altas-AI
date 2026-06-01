import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { ALTASAI_COLORS, ALTASAI_LAYOUT, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';
import { GlassCard } from '../ui/GlassCard';

interface CommandCardProps {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  footer?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const CommandCard = ({
  title,
  eyebrow,
  children,
  right,
  footer,
  style,
}: CommandCardProps) => (
  <GlassCard variant="command" style={[styles.card, style]} padding="lg">
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {right ? <View>{right}</View> : null}
    </View>
    <View style={styles.body}>{children}</View>
    {footer ? <View style={styles.footer}>{footer}</View> : null}
  </GlassCard>
);

const styles = StyleSheet.create({
  card: {
    minHeight: ALTASAI_LAYOUT.commandCardMinHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: ALTASAI_SPACING.md,
  },
  titleBlock: {
    flex: 1,
  },
  eyebrow: {
    color: ALTASAI_COLORS.accent.bright,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    textTransform: 'uppercase',
  },
  title: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xl,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    letterSpacing: ALTASAI_TYPOGRAPHY.tracking.normal,
  },
  body: {
    marginTop: ALTASAI_SPACING.md,
  },
  footer: {
    marginTop: ALTASAI_SPACING.md,
  },
});
