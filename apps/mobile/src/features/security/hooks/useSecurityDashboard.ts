import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clipboard } from 'react-native';
import { router } from 'expo-router';

import { ROUTES } from '../../../constants/routes';
import { calculateTrustScore, getRecentScans } from '../../../services/security/analysis';
import { useAuthStore } from '../../../stores/authStore';
import type { SecurityScan } from '../../../types/firestore';
import { safeImpactAsync, ImpactFeedbackStyle } from '../../../utils/haptics';

export function useSecurityDashboard() {
  const { user } = useAuthStore();
  const [trustScore, setTrustScore] = useState(75);
  const [recentScans, setRecentScans] = useState<SecurityScan[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadSecurityData = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const [score, scans] = await Promise.all([
        calculateTrustScore(user.uid),
        getRecentScans(user.uid, 5),
      ]);
      setTrustScore(score);
      setRecentScans(scans);
    } finally {
      setRefreshing(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void loadSecurityData();
  }, [loadSecurityData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    safeImpactAsync(ImpactFeedbackStyle.Light);
    void loadSecurityData();
  }, [loadSecurityData]);

  const handleAction = useCallback((route: string) => {
    safeImpactAsync(ImpactFeedbackStyle.Medium);
    router.push(route as never);
  }, []);

  const handleScanClipboard = useCallback(async () => {
    safeImpactAsync(ImpactFeedbackStyle.Medium);
    const text = await Clipboard.getString();
    if (text) {
      router.push({ pathname: ROUTES.MAIN.SCAN_LINK, params: { text } } as never);
    }
  }, []);

  const insight = useMemo(() => {
    const riskyScans = recentScans.filter(
      (scan) => scan.result.isThreat || scan.result.riskScore >= 60
    ).length;
    const cyberDisciplineScore = Math.max(0, Math.min(100, trustScore - riskyScans * 4));
    const securityInsight =
      riskyScans > 0
        ? `${riskyScans} risky scan${riskyScans === 1 ? '' : 's'} found. Cortex will treat this as a cyber discipline warning.`
        : 'No risky scan in recent history. Keep scanning unknown links before acting.';

    return { riskyScans, cyberDisciplineScore, securityInsight };
  }, [recentScans, trustScore]);

  return {
    trustScore,
    recentScans,
    refreshing,
    insight,
    onRefresh,
    handleAction,
    handleScanClipboard,
  };
}
