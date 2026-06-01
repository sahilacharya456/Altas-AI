import { StyleSheet } from 'react-native';

import { ALTASAI_COLORS, ALTASAI_TYPOGRAPHY } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: ALTASAI_COLORS.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: ALTASAI_COLORS.text.tertiary,
  },
  mainCard: {
    padding: 24,
    marginBottom: 20,
  },
  statusCard: {
    padding: 24,
    marginBottom: 20,
  },
  statusScore: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
  },
  cortexText: {
    fontSize: 13,
    lineHeight: 19,
    color: ALTASAI_COLORS.text.secondary,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ALTASAI_COLORS.text.primary,
    marginBottom: 20,
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timeValue: {
    fontSize: 48,
    fontWeight: '700',
    color: ALTASAI_COLORS.primary.DEFAULT,
  },
  timeExceeded: {
    color: ALTASAI_COLORS.error.DEFAULT,
  },
  timeLabel: {
    fontSize: 14,
    color: ALTASAI_COLORS.text.tertiary,
    marginTop: 8,
  },
  progressBarContainer: {
    marginBottom: 24,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: ALTASAI_COLORS.primary.DEFAULT,
    borderRadius: 4,
  },
  progressExceeded: {
    backgroundColor: ALTASAI_COLORS.error.DEFAULT,
  },
  progressText: {
    fontSize: 12,
    color: ALTASAI_COLORS.text.tertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ALTASAI_COLORS.text.secondary,
    marginBottom: 8,
    marginTop: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  notesInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    color: ALTASAI_COLORS.text.primary,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  saveButton: {
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  statIcon: {
    position: 'relative',
    marginBottom: 8,
  },
  statEmoji: {
    color: ALTASAI_COLORS.accent.bright,
    fontSize: ALTASAI_TYPOGRAPHY.size.sm,
    fontWeight: ALTASAI_TYPOGRAPHY.weight.bold,
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: ALTASAI_COLORS.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: ALTASAI_COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statSubtext: {
    fontSize: 10,
    color: ALTASAI_COLORS.text.tertiary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ALTASAI_COLORS.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  historyCard: {
    padding: 16,
    marginBottom: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  historyLeft: {
    flexDirection: 'column',
  },
  historyDay: {
    fontSize: 14,
    fontWeight: '600',
    color: ALTASAI_COLORS.text.primary,
  },
  historyDate: {
    fontSize: 12,
    color: ALTASAI_COLORS.text.tertiary,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyTime: {
    fontSize: 16,
    fontWeight: '600',
    color: ALTASAI_COLORS.success.DEFAULT,
  },
  historyTimeOver: {
    color: ALTASAI_COLORS.error.DEFAULT,
  },
  historyStatus: {
    fontSize: 11,
    color: ALTASAI_COLORS.text.tertiary,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 40,
  },
});
