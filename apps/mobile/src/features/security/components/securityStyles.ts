import { StyleSheet } from 'react-native';

import { ALTASAI_COLORS, ALTASAI_SPACING, ALTASAI_TYPOGRAPHY } from '../../../theme';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: ALTASAI_SPACING[4],
  },
  header: {
    marginBottom: ALTASAI_SPACING[6],
  },
  securityVisual: {
    width: '100%',
    aspectRatio: 1.65,
    borderRadius: 22,
    marginBottom: ALTASAI_SPACING[5],
    borderWidth: 1,
    borderColor: ALTASAI_COLORS.border.accent,
  },
  title: {
    fontSize: ALTASAI_TYPOGRAPHY.size['3xl'],
    fontWeight: 'bold',
    color: ALTASAI_COLORS.text.primary,
    marginBottom: ALTASAI_SPACING[1],
  },
  subtitle: {
    fontSize: ALTASAI_TYPOGRAPHY.size.base,
    color: ALTASAI_COLORS.text.tertiary,
  },
  scoreContainer: {
    marginBottom: ALTASAI_SPACING[6],
  },
  scoreContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: ALTASAI_SPACING[1],
  },
  scoreValue: {
    fontSize: ALTASAI_TYPOGRAPHY.size['3xl'],
    fontWeight: 'bold',
    marginBottom: ALTASAI_SPACING[1],
  },
  scoreStatus: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.tertiary,
  },
  ringContainer: {
    marginLeft: ALTASAI_SPACING[4],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ALTASAI_SPACING[3],
    marginBottom: ALTASAI_SPACING[6],
  },
  gridItem: {
    width: '48%',
  },
  actionCard: {
    alignItems: 'center',
    padding: ALTASAI_SPACING[4],
  },
  actionTitle: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: '600',
    color: ALTASAI_COLORS.text.primary,
  },
  section: {
    marginBottom: ALTASAI_SPACING[4],
  },
  sectionTitle: {
    fontSize: ALTASAI_TYPOGRAPHY.size.lg,
    fontWeight: '600',
    color: ALTASAI_COLORS.text.primary,
    marginBottom: ALTASAI_SPACING[3],
  },
  logCard: {
    marginBottom: ALTASAI_SPACING[2],
    padding: ALTASAI_SPACING[3],
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: ALTASAI_SPACING[1],
  },
  logType: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    color: ALTASAI_COLORS.text.tertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  logStatus: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    fontWeight: 'bold',
  },
  logTarget: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    color: ALTASAI_COLORS.text.secondary,
  },
  emptyState: {
    textAlign: 'center',
    color: ALTASAI_COLORS.text.tertiary,
    padding: ALTASAI_SPACING[4],
    fontStyle: 'italic',
  },
  signalText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    lineHeight: 20,
    color: ALTASAI_COLORS.text.secondary,
    marginBottom: ALTASAI_SPACING[2],
  },
  disclaimer: {
    marginTop: ALTASAI_SPACING[2],
    padding: ALTASAI_SPACING[4],
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: ALTASAI_TYPOGRAPHY.size.xs,
    color: ALTASAI_COLORS.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
  bottomSpacer: {
    height: 40,
  },
  threatWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: ALTASAI_SPACING[2],
  },
});
