import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ALTASAI_COLORS, ALTASAI_RADIUS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../theme';
import { RiskBadge, type RiskLevel } from '../feedback';

interface TimelineItemProps {
  title: string;
  message: string;
  timestamp: string;
  severity?: RiskLevel;
}

export const TimelineItem = ({ title, message, timestamp, severity = 'low' }: TimelineItemProps) => (
  <View style={styles.row}>
    <View style={styles.rail}>
      <View style={styles.dot} />
      <View style={styles.line} />
    </View>
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.time}>{timestamp}</Text>
        <RiskBadge level={severity} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: ALTASAI_SPACING.md,
  },
  rail: {
    width: 16,
    alignItems: 'center',
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: ALTASAI_RADIUS.full,
    backgroundColor: ALTASAI_COLORS.accent.bright,
    marginTop: ALTASAI_SPACING.md,
  },
  line: {
    flex: 1,
    width: 1,
    backgroundColor: ALTASAI_COLORS.border.secondary,
  },
  card: {
    flex: 1,
    padding: ALTASAI_SPACING.md,
    borderRadius: ALTASAI_RADIUS.lg,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.secondary,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ALTASAI_SPACING.xs,
  },
  time: {
    color: ALTASAI_COLORS.text.muted,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
  },
  title: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  message: {
    marginTop: 3,
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
  },
});
