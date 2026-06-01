import { StyleSheet } from 'react-native';

import {
  ALTASAI_COLORS,
  ALTASAI_LAYOUT,
  ALTASAI_RADIUS,
  ALTASAI_SPACING,
  ALTASAI_TYPOGRAPHY,
} from '../../../theme';

export const styles = StyleSheet.create({
  coreBriefing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ALTASAI_SPACING.md,
  },
  coreCopy: {
    flex: 1,
    gap: ALTASAI_SPACING.xs,
  },
  coreTitle: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.lg,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
  },
  coreText: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: ALTASAI_SPACING.sm,
  },
  statusCard: {
    flex: 1,
  },
  briefingBody: {
    flexDirection: 'row',
    gap: ALTASAI_SPACING.md,
  },
  briefingMetric: {
    width: 92,
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ALTASAI_RADIUS.xl,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.accent,
    backgroundColor: ALTASAI_COLORS.accent.glow,
  },
  metricLabel: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    textAlign: 'center',
  },
  metricValue: {
    marginTop: ALTASAI_SPACING.xs,
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size['2xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
  },
  briefingCopy: {
    flex: 1,
    gap: ALTASAI_SPACING.xs,
  },
  briefingLabel: {
    color: ALTASAI_COLORS.accent.bright,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    textTransform: 'uppercase',
  },
  briefingText: {
    color: ALTASAI_COLORS.text.secondary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: ALTASAI_TYPOGRAPHY.size.sm * ALTASAI_TYPOGRAPHY.leading.normal,
    marginBottom: ALTASAI_SPACING.xs,
  },
  scoreLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ALTASAI_SPACING.lg,
  },
  scoreStats: {
    flex: 1,
    gap: ALTASAI_SPACING.sm,
  },
  statPill: {
    minHeight: ALTASAI_LAYOUT.minTouchTarget,
    justifyContent: 'center',
    borderRadius: ALTASAI_RADIUS.lg,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
    paddingHorizontal: ALTASAI_SPACING.md,
  },
  statPillValue: {
    color: ALTASAI_COLORS.text.primary,
    fontSize: ALTASAI_TYPOGRAPHY.size.lg,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
  },
  statPillLabel: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.medium,
  },
  actionList: {
    gap: ALTASAI_SPACING.sm,
  },
  mutedText: {
    color: ALTASAI_COLORS.text.tertiary,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
  },
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ALTASAI_SPACING.sm,
  },
  moduleCard: {
    width: '48%',
  },
});
