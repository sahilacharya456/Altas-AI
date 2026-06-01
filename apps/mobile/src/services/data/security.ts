/**
 * Security Events Data Service
 * Firestore operations for security monitoring and alerts
 */

import {
    addDocument,
    getDocument,
    updateDocument,
    queryCollection,
    subscribeToCollection,
    where,
    orderBy,
    limit,
} from '../firebase';
import { SecurityEvent } from '../../types/firestore';

const COLLECTION = 'securityEvents';

/**
 * Log a security event
 */
export const logSecurityEvent = async (
    data: Omit<SecurityEvent, 'id' | 'createdAt' | 'resolved'>
): Promise<string> => {
    return addDocument<SecurityEvent>(COLLECTION, {
        ...data,
        resolved: false,
    } as Omit<SecurityEvent, 'id'>);
};

/**
 * Get a security event by ID
 */
export const getSecurityEvent = async (
    eventId: string
): Promise<SecurityEvent | null> => {
    return getDocument<SecurityEvent>(`${COLLECTION}/${eventId}`);
};

/**
 * Mark a security event as resolved
 */
export const resolveSecurityEvent = async (eventId: string): Promise<void> => {
    return updateDocument(`${COLLECTION}/${eventId}`, {
        resolved: true,
    });
};

/**
 * Get recent security events
 */
export const getRecentSecurityEvents = async (
    count: number = 10
): Promise<SecurityEvent[]> => {
    return queryCollection<SecurityEvent>(COLLECTION, [
        orderBy('createdAt', 'desc'),
        limit(count),
    ]);
};

/**
 * Get unresolved security events
 */
export const getUnresolvedEvents = async (): Promise<SecurityEvent[]> => {
    return queryCollection<SecurityEvent>(COLLECTION, [
        where('resolved', '==', false),
        orderBy('createdAt', 'desc'),
    ]);
};

/**
 * Get events by severity
 */
export const getEventsBySeverity = async (
    severity: SecurityEvent['severity']
): Promise<SecurityEvent[]> => {
    return queryCollection<SecurityEvent>(COLLECTION, [
        where('severity', '==', severity),
        where('resolved', '==', false),
        orderBy('createdAt', 'desc'),
    ]);
};

/**
 * Subscribe to unresolved events (real-time)
 */
export const subscribeToUnresolvedEvents = (
    callback: (events: SecurityEvent[]) => void
): (() => void) => {
    return subscribeToCollection<SecurityEvent>(COLLECTION, callback, [
        where('resolved', '==', false),
        orderBy('createdAt', 'desc'),
    ]);
};

/**
 * Log a phishing attempt
 */
export const logPhishingAttempt = async (
    url: string,
    source: string
): Promise<string> => {
    return logSecurityEvent({
        type: 'phishing_attempt',
        severity: 'high',
        description: `Potential phishing URL detected: ${url}`,
        metadata: {
            url,
            source,
            detectedAt: new Date().toISOString(),
        },
    });
};

/**
 * Log a suspicious URL
 */
export const logSuspiciousUrl = async (
    url: string,
    reason: string
): Promise<string> => {
    return logSecurityEvent({
        type: 'suspicious_url',
        severity: 'medium',
        description: `Suspicious URL flagged: ${reason}`,
        metadata: {
            url,
            reason,
            detectedAt: new Date().toISOString(),
        },
    });
};

/**
 * Log a behavior alert
 */
export const logBehaviorAlert = async (
    alertType: string,
    details: string
): Promise<string> => {
    return logSecurityEvent({
        type: 'behavior_alert',
        severity: 'low',
        description: `Behavior alert: ${alertType} - ${details}`,
        metadata: {
            alertType,
            details,
            detectedAt: new Date().toISOString(),
        },
    });
};

/**
 * Get security summary
 */
export const getSecuritySummary = async (): Promise<{
    unresolved: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    recentEvents: SecurityEvent[];
}> => {
    const unresolvedEvents = await getUnresolvedEvents();

    return {
        unresolved: unresolvedEvents.length,
        critical: unresolvedEvents.filter(e => e.severity === 'critical').length,
        high: unresolvedEvents.filter(e => e.severity === 'high').length,
        medium: unresolvedEvents.filter(e => e.severity === 'medium').length,
        low: unresolvedEvents.filter(e => e.severity === 'low').length,
        recentEvents: unresolvedEvents.slice(0, 5),
    };
};

/**
 * Check URL safety (basic client-side check)
 * Note: For production, proxy VirusTotal or Google Safe Browsing through the authenticated Express backend.
 */
export const checkUrlSafety = async (url: string): Promise<{
    isSafe: boolean;
    reason?: string;
}> => {
    try {
        const urlObj = new URL(url);

        // Basic checks
        const suspiciousPatterns = [
            /login.*\d{5,}/, // login with many numbers
            /verify.*account/i,
            /update.*payment/i,
            /suspended.*account/i,
            /.{50,}\./, // Very long subdomain
        ];

        const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq'];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(urlObj.hostname + urlObj.pathname)) {
                await logSuspiciousUrl(url, 'Matches suspicious pattern');
                return { isSafe: false, reason: 'URL matches known phishing patterns' };
            }
        }

        for (const tld of suspiciousTlds) {
            if (urlObj.hostname.endsWith(tld)) {
                await logSuspiciousUrl(url, 'Uses suspicious TLD');
                return { isSafe: false, reason: 'URL uses suspicious top-level domain' };
            }
        }

        // Protocol check
        if (urlObj.protocol !== 'https:') {
            return { isSafe: true, reason: 'Warning: URL does not use HTTPS' };
        }

        return { isSafe: true };
    } catch {
        return { isSafe: false, reason: 'Invalid URL format' };
    }
};
