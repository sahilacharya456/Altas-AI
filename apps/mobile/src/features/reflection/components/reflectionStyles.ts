import { StyleSheet } from 'react-native';

import { theme } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
  },
  progressContainer: {
    width: '100%',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressGradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  stepContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  moonContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
    position: 'relative',
  },
  moonEmoji: {
    fontSize: 80,
  },
  moonGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.accent.glow,
    opacity: 0.3,
  },
  introTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 16,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: 32,
  },
  summaryCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
    marginBottom: 20,
  },
  summaryRing: {
    marginBottom: 24,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  summaryStatLabel: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  introAction: {
    alignItems: 'center',
  },
  introTime: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    marginTop: 16,
  },
  questionContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  questionEmoji: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 15,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: 40,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 48,
  },
  moodOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 60,
  },
  moodOptionSelected: {
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
    borderColor: theme.colors.primary.DEFAULT,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  moodLabelSelected: {
    color: theme.colors.primary.light,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 15,
    color: theme.colors.text.tertiary,
  },
  inputCard: {
    padding: 16,
    marginBottom: 16,
  },
  textInput: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text.primary,
    minHeight: 100,
  },
  skipHint: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: 32,
  },
  summaryHeading: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  summarySubheading: {
    fontSize: 15,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginBottom: 32,
  },
  reflectionCard: {
    padding: 24,
    marginBottom: 20,
  },
  reflectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  reflectionItem: {
    flex: 1,
    alignItems: 'center',
  },
  reflectionEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  reflectionLabel: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reflectionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  reflectionDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  reflectionSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 16,
  },
  reflectionSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  reflectionSectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.text.tertiary,
  },
  insightCard: {
    padding: 20,
    marginBottom: 32,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.accent.DEFAULT,
    letterSpacing: 1,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.text.secondary,
  },
  completeActions: {
    alignItems: 'center',
  },
  editButton: {
    paddingVertical: 16,
  },
  editButtonText: {
    fontSize: 15,
    color: theme.colors.text.tertiary,
  },
});
