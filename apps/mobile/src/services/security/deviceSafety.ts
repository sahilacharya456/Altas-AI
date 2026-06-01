/**
 * AltasAI Shield - Device Safety Analyzer
 * Comprehensive device security health scoring (0-100)
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timestamp } from '../firebase';
import { setDocument } from '../firebase/firestore';
import type { DeviceRiskReport } from '../../types/firestore';

export interface DeviceSafetyMetrics {
    lockScreenEnabled: boolean;
    osUpToDate: boolean;
    unknownSourcesAllowed: boolean; // Android only
    accessibilityServicesCount: number;
    dangerousPermissionsCount: number;
    screenTimeoutMinutes: number;
}

export interface DeviceSafetyIssue {
    severity: 'critical' | 'high' | 'medium' | 'low';
    issue: string;
    fix: string;
    impact: number; // Points deducted
}

export interface DeviceSafetyScore {
    overallScore: number; // 0-100 (100 = perfectly secure)
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    metrics: DeviceSafetyMetrics;
    issues: DeviceSafetyIssue[];
    strengths: string[];
}

/**
 * Calculate comprehensive device safety score
 */
export const calculateDeviceSafetyScore = async (): Promise<DeviceSafetyScore> => {
    let score = 100; // Start with perfect score
    const issues: DeviceSafetyIssue[] = [];
    const strengths: string[] = [];

    // 1. Lock Screen (25 points)
    const lockScreenEnabled = await checkLockScreen();
    if (!lockScreenEnabled) {
        score -= 25;
        issues.push({
            severity: 'critical',
            issue: 'No lock screen enabled',
            fix: 'Settings → Security → Screen Lock → Choose PIN/Pattern/Fingerprint',
            impact: 25,
        });
    } else {
        strengths.push('Lock screen enabled');
    }

    // 2. OS Updates (20 points)
    const osUpToDate = await checkOSVersion();
    if (!osUpToDate) {
        score -= 20;
        issues.push({
            severity: 'high',
            issue: 'Operating system is outdated',
            fix: 'Settings → System → System Update → Check for updates',
            impact: 20,
        });
    } else {
        strengths.push('OS is up-to-date');
    }

    // 3. Unknown Sources - Android (15 points)
    let unknownSourcesAllowed = false;
    if (Platform.OS === 'android') {
        unknownSourcesAllowed = await checkUnknownSources();
        if (unknownSourcesAllowed) {
            score -= 15;
            issues.push({
                severity: 'high',
                issue: 'Installation from unknown sources enabled',
                fix: 'Settings → Security → Unknown Sources → Disable',
                impact: 15,
            });
        } else {
            strengths.push('Unknown sources disabled');
        }
    }

    // 4. Accessibility Services Abuse (20 points)
    const accessibilityCount = await getAccessibilityServicesCount();
    if (accessibilityCount > 2) {
        score -= 20;
        issues.push({
            severity: 'critical',
            issue: `${accessibilityCount} apps have accessibility access (potential keylogging)`,
            fix: 'Settings → Accessibility → Review and disable unnecessary services',
            impact: 20,
        });
    } else if (accessibilityCount === 0) {
        strengths.push('No accessibility services enabled');
    }

    // 5. Dangerous Permissions (15 points)
    const dangerousPerms = await countDangerousPermissions();
    if (dangerousPerms > 10) {
        score -= 15;
        issues.push({
            severity: 'medium',
            issue: `${dangerousPerms} apps have sensitive permissions`,
            fix: 'Review app permissions in AltasAI Shield -> Permission Analyzer',
            impact: 15,
        });
    }

    // 6. Screen Timeout (5 points)
    const timeoutMinutes = await getScreenTimeout();
    if (timeoutMinutes > 5) {
        score -= 5;
        issues.push({
            severity: 'low',
            issue: 'Screen timeout too long (allows unauthorized access)',
            fix: 'Settings → Display → Screen Timeout → Set to 1-2 minutes',
            impact: 5,
        });
    } else {
        strengths.push('Screen timeout configured securely');
    }

    // Calculate grade
    const grade = score >= 90 ? 'A' :
        score >= 80 ? 'B' :
            score >= 70 ? 'C' :
                score >= 60 ? 'D' : 'F';

    const metrics: DeviceSafetyMetrics = {
        lockScreenEnabled,
        osUpToDate,
        unknownSourcesAllowed,
        accessibilityServicesCount: accessibilityCount,
        dangerousPermissionsCount: dangerousPerms,
        screenTimeoutMinutes: timeoutMinutes,
    };

    return {
        overallScore: Math.max(score, 0),
        grade,
        metrics,
        issues,
        strengths,
    };
};

/**
 * Save device safety report to Firestore
 */
export const saveDeviceSafetyReport = async (
    userId: string,
    safetyScore: DeviceSafetyScore
): Promise<void> => {
    const reportId = `${userId}_${Date.now()}`;

    // Store current score for next comparison

    await setDocument<Partial<DeviceRiskReport>>(`deviceRiskReports/${reportId}`, {
        userId,
        overallRisk: safetyScore.grade === 'A' || safetyScore.grade === 'B' ? 'low' :
            safetyScore.grade === 'C' ? 'medium' :
                safetyScore.grade === 'D' ? 'high' : 'critical',
        riskScore: 100 - safetyScore.overallScore,
        apps: [], // Will be populated by permission analyzer
        generatedAt: Timestamp.now(),
    });

    // Store current score for next comparison
    await AsyncStorage.setItem('device_safety_score', safetyScore.overallScore.toString());
};

// Helper functions (OS-Compliant with user confirmation)

async function checkLockScreen(): Promise<boolean> {
    const stored = await AsyncStorage.getItem('lock_screen_enabled');
    if (stored === null) {
        // Default assumption: most users have lock screen
        return true;
    }
    return stored === 'true';
}

async function checkOSVersion(): Promise<boolean> {
    const currentVersion = typeof Platform.Version === 'string'
        ? parseInt(Platform.Version.split('.')[0], 10)
        : Platform.Version;

    // Minimum secure versions
    const minimumSecureVersion = Platform.OS === 'android' ? 12 : 15;

    return currentVersion >= minimumSecureVersion;
}

async function checkUnknownSources(): Promise<boolean> {
    const stored = await AsyncStorage.getItem('unknown_sources_enabled');
    return stored === 'true';
}

async function getAccessibilityServicesCount(): Promise<number> {
    const stored = await AsyncStorage.getItem('accessibility_services_count');
    return parseInt(stored || '0', 10);
}

async function countDangerousPermissions(): Promise<number> {
    // This will be populated from permission analyzer
    const stored = await AsyncStorage.getItem('dangerous_permissions_count');
    return parseInt(stored || '5', 10); // Default estimate
}

async function getScreenTimeout(): Promise<number> {
    const stored = await AsyncStorage.getItem('screen_timeout_minutes');
    return parseInt(stored || '2', 10); // Default assumption: 2 minutes
}

/**
 * User configuration helpers (one-time setup)
 */
export const configureDeviceSafety = async (config: {
    lockScreenEnabled?: boolean;
    unknownSourcesEnabled?: boolean;
    accessibilityServicesCount?: number;
    screenTimeoutMinutes?: number;
}) => {
    if (config.lockScreenEnabled !== undefined) {
        await AsyncStorage.setItem('lock_screen_enabled', config.lockScreenEnabled.toString());
    }
    if (config.unknownSourcesEnabled !== undefined) {
        await AsyncStorage.setItem('unknown_sources_enabled', config.unknownSourcesEnabled.toString());
    }
    if (config.accessibilityServicesCount !== undefined) {
        await AsyncStorage.setItem('accessibility_services_count', config.accessibilityServicesCount.toString());
    }
    if (config.screenTimeoutMinutes !== undefined) {
        await AsyncStorage.setItem('screen_timeout_minutes', config.screenTimeoutMinutes.toString());
    }
};
