/**
 * AltasAI Shield - Wi-Fi Security Analyzer
 * Network connection safety assessment
 */

import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Timestamp } from '../firebase';
import { setDocument } from '../firebase/firestore';

export interface WiFiRiskAnalysis {
    riskScore: number; // 0-100
    riskLevel: 'safe' | 'caution' | 'unsafe';
    findings: string[];
    recommendations: string[];
    sensitiveActionsAllowed: boolean;
    networkType: 'wifi' | 'cellular' | 'none';
    isPublic: boolean;
}

/**
 * Analyze current Wi-Fi security
 */
export const analyzeWiFiSecurity = async (): Promise<WiFiRiskAnalysis> => {
    const network = await Network.getNetworkStateAsync();
    let score = 0;
    const findings: string[] = [];
    const recommendations: string[] = [];
    let isPublic = false;

    // Connection type analysis
    if (network.type === Network.NetworkStateType.WIFI) {
        // Check if user has marked this as public Wi-Fi
        isPublic = await detectPublicWiFi();

        if (isPublic) {
            score += 60;
            findings.push('Connected to public Wi-Fi network');
            recommendations.push('Avoid sensitive transactions (banking, payments)');
            recommendations.push('Enable VPN for encrypted connection');
            recommendations.push('Switch to cellular data for sensitive actions');
        } else {
            findings.push('Connected to private Wi-Fi network');
            recommendations.push('Ensure your home router password is strong');
        }

        // Check internet reachability
        if (!network.isInternetReachable) {
            score += 20;
            findings.push('No internet access despite Wi-Fi connection');
            recommendations.push('Possible captive portal or network configuration issue');
            recommendations.push('Verify network connection or try switching networks');
        }
    } else if (network.type === Network.NetworkStateType.CELLULAR) {
        score = 0; // Cellular is inherently more secure
        findings.push('Using cellular data (more secure than public Wi-Fi)');
        recommendations.push('Cellular data is safe for sensitive transactions');
    } else {
        score = 100;
        findings.push('No network connection');
        recommendations.push('Connect to a trusted network to use the app');
    }

    const riskLevel = score > 60 ? 'unsafe' : score > 30 ? 'caution' : 'safe';

    return {
        riskScore: score,
        riskLevel,
        findings,
        recommendations,
        sensitiveActionsAllowed: score < 50,
        networkType: network.type === Network.NetworkStateType.WIFI ? 'wifi' :
            network.type === Network.NetworkStateType.CELLULAR ? 'cellular' : 'none',
        isPublic,
    };
};

/**
 * Detect if connected to public Wi-Fi (user-assisted)
 */
async function detectPublicWiFi(): Promise<boolean> {
    const stored = await AsyncStorage.getItem('wifi_is_public');
    if (stored === null) {
        // Default to false if not specified
        return false;
    }
    return stored === 'true';
}

/**
 * Mark current network as public/private
 */
export const setWiFiPublicStatus = async (isPublic: boolean): Promise<void> => {
    await AsyncStorage.setItem('wifi_is_public', isPublic.toString());
};

/**
 * Check if sensitive action is allowed on current network
 */
export const isSensitiveActionAllowed = async (): Promise<{
    allowed: boolean;
    reason?: string;
}> => {
    const wifiRisk = await analyzeWiFiSecurity();

    if (!wifiRisk.sensitiveActionsAllowed) {
        return {
            allowed: false,
            reason: wifiRisk.riskLevel === 'unsafe'
                ? 'You are connected to public Wi-Fi. Switch to cellular data for this action.'
                : 'Network security cannot be verified. Use a trusted network.',
        };
    }

    return { allowed: true };
};

/**
 * Log Wi-Fi security event to Firestore
 */
export const logWiFiSecurityEvent = async (
    userId: string,
    wifiRisk: WiFiRiskAnalysis,
    sensitiveActionBlocked: boolean = false
): Promise<void> => {
    const eventId = `${userId}_${Date.now()}`;

    await setDocument(`wifiSecurityEvents/${eventId}`, {
        userId,
        networkType: wifiRisk.networkType,
        riskScore: wifiRisk.riskScore,
        isPublic: wifiRisk.isPublic,
        sensitiveActionBlocked,
        timestamp: Timestamp.now(),
    });
};

/**
 * Get Wi-Fi security recommendations based on risk
 */
export const getWiFiSecurityTips = (riskLevel: WiFiRiskAnalysis['riskLevel']): string[] => {
    switch (riskLevel) {
        case 'unsafe':
            return [
                'Switch to cellular data for banking and payments',
                'Enable VPN if you must use public Wi-Fi',
                'Avoid entering passwords or sensitive information',
                'Disable auto-connect to unknown networks',
            ];
        case 'caution':
            return [
                'Verify network authenticity before connecting',
                'Be cautious with sensitive transactions',
                'Consider using VPN for added security',
            ];
        case 'safe':
            return [
                'Keep your home Wi-Fi password strong and unique',
                'Regularly update router firmware',
                'Enable WPA3 encryption if available',
            ];
    }
};
