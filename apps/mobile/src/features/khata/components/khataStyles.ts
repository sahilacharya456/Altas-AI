import { StyleSheet } from 'react-native';

import { ALTASAI_COLORS } from '../../../theme/colors';
import { ALTASAI_SPACING } from '../../../theme/spacing';
import { ALTASAI_TYPOGRAPHY } from '../../../theme/typography';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ALTASAI_SPACING[5],
  },
  loadingPanel: {
    marginHorizontal: ALTASAI_SPACING[5],
    marginTop: ALTASAI_SPACING[10],
  },
  emptyStatePanel: {
    paddingHorizontal: ALTASAI_SPACING[5],
    paddingTop: ALTASAI_SPACING[10],
  },
  emptyStateTitle: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xl,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: ALTASAI_COLORS.text.primary,
    marginTop: ALTASAI_SPACING[6],
    marginBottom: ALTASAI_SPACING[2],
  },
  emptyStateText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    color: ALTASAI_COLORS.text.tertiary,
    lineHeight: 22,
    marginBottom: ALTASAI_SPACING[6],
  },
  header: {
    paddingTop: ALTASAI_SPACING[5],
    paddingBottom: ALTASAI_SPACING[6],
  },
  title: {
    fontSize: ALTASAI_TYPOGRAPHY.size['3xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: ALTASAI_COLORS.text.primary,
    marginBottom: ALTASAI_SPACING[1],
  },
  subtitle: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    color: ALTASAI_COLORS.text.tertiary,
  },
  budgetCard: {
    padding: ALTASAI_SPACING[6],
    marginBottom: ALTASAI_SPACING[5],
  },
  cardTitle: {
    fontSize: ALTASAI_TYPOGRAPHY.size.lg,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    color: ALTASAI_COLORS.text.primary,
    marginBottom: ALTASAI_SPACING[4],
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: ALTASAI_SPACING[4],
  },
  spentAmount: {
    fontSize: ALTASAI_TYPOGRAPHY.size['3xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: ALTASAI_COLORS.text.primary,
  },
  totalAmount: {
    fontSize: ALTASAI_TYPOGRAPHY.size.lg,
    color: ALTASAI_COLORS.text.tertiary,
    marginLeft: ALTASAI_SPACING[2],
  },
  progressContainer: {
    height: 8,
    backgroundColor: ALTASAI_COLORS.background.secondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: ALTASAI_SPACING[3],
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ALTASAI_SPACING[3],
  },
  statusText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.tertiary,
  },
  paceText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
  },
  remainingText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    color: ALTASAI_COLORS.text.secondary,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ALTASAI_SPACING[4],
  },
  scoreLabel: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    color: ALTASAI_COLORS.text.tertiary,
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: ALTASAI_TYPOGRAPHY.size['2xl'],
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    marginTop: ALTASAI_SPACING[1],
  },
  signalBox: {
    marginTop: ALTASAI_SPACING[4],
    padding: ALTASAI_SPACING[3],
    borderRadius: 10,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
  },
  signalTitle: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    color: ALTASAI_COLORS.accent.bright,
    textTransform: 'uppercase',
    marginBottom: ALTASAI_SPACING[1],
  },
  signalText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.secondary,
    lineHeight: 20,
  },
  warningText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.warning.light,
    textAlign: 'center',
    marginTop: ALTASAI_SPACING[3],
  },
  categoryCard: {
    padding: ALTASAI_SPACING[6],
    marginBottom: ALTASAI_SPACING[5],
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ALTASAI_SPACING[4],
  },
  categoryIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
    backgroundColor: ALTASAI_COLORS.surface.subtle,
    color: ALTASAI_COLORS.accent.bright,
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    marginRight: ALTASAI_SPACING[3],
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingTop: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ALTASAI_SPACING[2],
  },
  categoryName: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    color: ALTASAI_COLORS.text.primary,
  },
  categoryAmount: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: ALTASAI_COLORS.text.primary,
  },
  categoryLimit: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    color: ALTASAI_COLORS.text.tertiary,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.regular,
  },
  categoryProgressContainer: {
    height: 4,
    backgroundColor: ALTASAI_COLORS.background.secondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryProgress: {
    height: '100%',
  },
  khataCard: {
    padding: ALTASAI_SPACING[6],
    marginBottom: ALTASAI_SPACING[5],
  },
  khataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ALTASAI_SPACING[4],
  },
  khataItem: {
    alignItems: 'center',
  },
  khataLabel: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    color: ALTASAI_COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ALTASAI_SPACING[2],
  },
  khataAmount: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xl,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
  },
  debtColor: {
    color: ALTASAI_COLORS.error.primary,
  },
  creditColor: {
    color: ALTASAI_COLORS.success.primary,
  },
  ledgerButton: {
    paddingVertical: ALTASAI_SPACING[3],
    alignItems: 'center',
  },
  ledgerButtonText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    color: ALTASAI_COLORS.accent.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: ALTASAI_SPACING[3],
    marginBottom: ALTASAI_SPACING[5],
  },
  primaryButton: {
    flex: 1,
    backgroundColor: ALTASAI_COLORS.accent.primary,
    borderRadius: 12,
    paddingVertical: ALTASAI_SPACING[4],
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: ALTASAI_COLORS.background.elevated,
    borderRadius: 12,
    paddingVertical: ALTASAI_SPACING[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.primary,
  },
  secondaryButtonText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.semibold,
    color: ALTASAI_COLORS.text.secondary,
  },
  bottomSpacer: {
    height: 40,
  },
});
