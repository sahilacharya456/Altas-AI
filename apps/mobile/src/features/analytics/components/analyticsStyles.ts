import { Dimensions, StyleSheet } from 'react-native';

import { theme } from '../../../theme';

export const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CHART_WIDTH = SCREEN_WIDTH - 80;
export const CHART_HEIGHT = 120;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 4,
  },
  rangeButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rangeButtonActive: {
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  rangeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.text.tertiary,
  },
  rangeButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingPanel: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  scoreCard: {
    padding: 24,
    marginBottom: 24,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
  },
  changeBadge: {
    backgroundColor: 'rgba(0, 245, 160, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.success.DEFAULT,
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreInsights: {
    flex: 1,
    marginLeft: 24,
    gap: 16,
  },
  insightItem: {
    alignItems: 'flex-start',
  },
  insightValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  insightLabel: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  scoreVerdict: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  verdictText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  chartCard: {
    padding: 20,
    marginBottom: 24,
  },
  chartContainer: {
    position: 'relative',
  },
  chartLabels: {
    position: 'absolute',
    right: -35,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  chartMaxLabel: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  chartMinLabel: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 0,
  },
  chartLegendText: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 16,
    overflow: 'hidden',
  },
  statGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 11,
    color: theme.colors.text.tertiary,
    marginTop: 8,
  },
  insightsCard: {
    padding: 20,
    marginTop: 8,
  },
  insightsHeader: {
    marginBottom: 16,
  },
  insightsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightsTitle: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.accent.DEFAULT,
    letterSpacing: 1,
  },
  insightsList: {
    gap: 12,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  insightBullet: {
    fontSize: 14,
    color: theme.colors.accent.DEFAULT,
    marginRight: 10,
    marginTop: -2,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.secondary,
  },
  bottomSpacer: {
    height: 40,
  },
});
