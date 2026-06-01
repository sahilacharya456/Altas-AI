/**
 * AltasAI Shield - Security Analysis Service
 * Link & Text scanning with explainable risk detection
 */



import { Timestamp, orderBy } from '../firebase';
import { setDocument, queryCollection } from '../firebase/firestore';
import { limit } from '../firebase/firestore';
import type { SecurityScan, LinkAnalysis } from '../../types/firestore';
import * as Crypto from 'expo-crypto';
import { createBehaviorEvent } from '../data/behaviorEvents';

const SCANS_COLLECTION = 'securityScans';
const ANALYSIS_COLLECTION = 'linkAnalysis';

/**
 * URL Feature Extraction (Client-Side Pre-Check)
 */
interface URLFeatures {
    hasHTTPS: boolean;
    domainLength: number;
    hasIP: boolean;
    hasSuspiciousTLD: boolean;
    hasPort: boolean;
    urlLength: number;
    specialCharCount: number;
    subdomainCount: number;
}

const extractURLFeatures = (url: string): URLFeatures => {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;

        return {
            hasHTTPS: url.startsWith('https://'),
            domainLength: domain.length,
            hasIP: /\d+\.\d+\.\d+\.\d+/.test(domain),
            hasSuspiciousTLD: /\.(tk|ml|ga|xyz|gq)$/.test(domain),
            hasPort: urlObj.port !== '',
            urlLength: url.length,
            specialCharCount: (url.match(/[@?_~-]/g) || []).length,
            subdomainCount: (domain.match(/\./g) || []).length,
        };
    } catch {
        return {
            hasHTTPS: false,
            domainLength: 0,
            hasIP: false,
            hasSuspiciousTLD: false,
            hasPort: false,
            urlLength: url.length,
            specialCharCount: 0,
            subdomainCount: 0,
        };
    }
};

/**
 * Quick client-side risk assessment
 * Returns preliminary score (0-100) before ML analysis
 */
const quickURLRiskCheck = (url: string): number => {
    const features = extractURLFeatures(url);
    let score = 0;

    // High-risk indicators
    if (features.hasIP) score += 40; // IP address instead of domain
    if (features.hasSuspiciousTLD) score += 30; // Known phishing TLDs
    if (!features.hasHTTPS) score += 20; // No HTTPS
    if (features.urlLength > 100) score += 15; // Unusually long
    if (features.specialCharCount > 5) score += 10; // Too many special chars
    if (features.subdomainCount > 3) score += 10; // Many subdomains

    return Math.min(score, 100);
};

/**
 * Text Feature Extraction (Scam Detection)
 */
interface TextFeatures {
    urgencyKeywords: number;
    moneyKeywords: number;
    capsRatio: number;
    exclamationCount: number;
    hasPhoneNumber: boolean;
    wordCount: number;
}

const extractTextFeatures = (text: string): TextFeatures => {
    const urgencyWords = ['urgent', 'immediate', 'act now', 'limited time', 'expires', 'hurry'];
    const moneyWords = ['₹', 'free money', 'cash prize', 'lottery', 'won', 'claim'];

    return {
        urgencyKeywords: urgencyWords.filter(kw => text.toLowerCase().includes(kw)).length,
        moneyKeywords: moneyWords.filter(kw => text.toLowerCase().includes(kw)).length,
        capsRatio: (text.match(/[A-Z]/g) || []).length / Math.max(text.length, 1),
        exclamationCount: (text.match(/!/g) || []).length,
        hasPhoneNumber: /\d{10}/.test(text),
        wordCount: text.split(/\s+/).length,
    };
};

const quickTextRiskCheck = (text: string): number => {
    const features = extractTextFeatures(text);
    let score = 0;

    if (features.urgencyKeywords >= 2) score += 30;
    if (features.moneyKeywords >= 1) score += 35;
    if (features.capsRatio > 0.4) score += 20;
    if (features.exclamationCount > 3) score += 10;
    if (features.hasPhoneNumber && features.moneyKeywords > 0) score += 20;

    return Math.min(score, 100);
};

/**
 * Hash URL for privacy-safe storage
 */
const hashURL = async (url: string): Promise<string> => {
    return await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        url
    );
};

/**
 * Analyze URL for phishing/malware
 * Uses privacy-preserving client heuristics and cached results.
 * Backend defensive security advice is handled through protected AI routes.
 */
export const analyzeLinkSecurity = async (
    userId: string,
    url: string
): Promise<SecurityScan['result']> => {
    // Quick client-side check
    const quickScore = quickURLRiskCheck(url);
    const urlHash = await hashURL(url);

    // Check cache first (simplified - will implement proper query in Phase 2)
    // const cached = await queryCollection<LinkAnalysis>(ANALYSIS_COLLECTION, ...);

    // Generate reasons based on features
    const features = extractURLFeatures(url);
    const reasons = generateURLReasons(features);

    // Determine verdict
    const isThreat = quickScore > 70;
    const verdict = quickScore > 70 ? 'phishing' : quickScore > 40 ? 'suspicious' : 'safe';

    // Cache result (7 days TTL)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    try {
        await setDocument<Partial<LinkAnalysis>>(`${ANALYSIS_COLLECTION}/${urlHash}`, {
            userId,
            urlHash,
            domain: new URL(url).hostname,
            analysis: {
                phishingProb: quickScore / 100,
                features: features as any,
                verdict,
            },
            createdAt: Timestamp.now(),
            expiresAt: Timestamp.fromDate(expiresAt),
        });
    } catch (error) {
        if (__DEV__) console.error('[Security] Error caching link analysis:', error);
    }

    return {
        isThreat,
        riskScore: quickScore,
        confidence: 0.75, // Client-side confidence
        reasons,
        recommendation: getRecommendation(quickScore),
    };
};

/**
 * Analyze text for scams/phishing
 */
export const analyzeTextSecurity = async (
    _userId: string,
    text: string
): Promise<SecurityScan['result']> => {
    const quickScore = quickTextRiskCheck(text);
    const features = extractTextFeatures(text);

    // Import social engineering detector (will be available after file creation)
    // For now, use base analysis
    const reasons = generateTextReasons(features);
    const isThreat = quickScore > 65;

    return {
        isThreat,
        riskScore: quickScore,
        confidence: 0.7,
        reasons,
        recommendation: getRecommendation(quickScore),
    };
};

/**
 * Save security scan to Firestore
 */
export const saveScan = async (
    userId: string,
    type: SecurityScan['type'],
    input: string,
    result: SecurityScan['result']
): Promise<string> => {
    const scanId = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Hash URLs for privacy
    const storedInput = type === 'url' ? await hashURL(input) : input.substring(0, 100);

    await setDocument<Partial<SecurityScan>>(`${SCANS_COLLECTION}/${scanId}`, {
        userId,
        type,
        input: storedInput,
        result,
        scanDate: Timestamp.now(),
    });

    await createBehaviorEvent({
        source: 'security',
        eventType: result.isThreat ? 'risky_link_detected' : 'security_scan_completed',
        severity: result.riskScore >= 85 ? 'critical' : result.riskScore >= 65 ? 'high' : result.riskScore >= 40 ? 'medium' : 'low',
        title: result.isThreat ? 'Risky link or text detected' : 'Security scan completed',
        message: result.isThreat
            ? 'A scan detected risky content. AltasAI should raise cyber discipline warnings and recommend caution.'
            : 'A security scan was completed. AltasAI can use this as a cyber discipline signal.',
        metadata: {
            scanId,
            type,
            riskScore: result.riskScore,
            isThreat: result.isThreat,
        },
    });

    return scanId;
};

/**
 * Get recent scans for user
 */
export const getRecentScans = async (_userId: string, limitCount: number = 10): Promise<SecurityScan[]> => {
    return queryCollection<SecurityScan>(SCANS_COLLECTION, [
        orderBy('scanDate', 'desc'),
        limit(limitCount),
    ]);
};

/**
 * Generate explainable reasons for URL risk
 */
const generateURLReasons = (features: any): string[] => {
    const reasons: string[] = [];

    if (features.hasIP) {
        reasons.push('URL contains IP address instead of domain name');
    }
    if (features.hasSuspiciousTLD) {
        reasons.push('Top-level domain (.tk, .xyz, etc.) commonly used in phishing');
    }
    if (!features.hasHTTPS) {
        reasons.push('No HTTPS encryption detected');
    }
    if (features.urlLength > 100) {
        reasons.push('Unusually long URL (common in phishing attempts)');
    }
    if (features.specialCharCount > 5) {
        reasons.push('Excessive special characters in URL');
    }
    if (features.subdomainCount > 3) {
        reasons.push('Multiple subdomains (potential obfuscation)');
    }

    if (reasons.length === 0) {
        reasons.push('No immediate threats detected');
    }

    return reasons;
};

/**
 * Generate explainable reasons for text risk
 */
const generateTextReasons = (features: TextFeatures): string[] => {
    const reasons: string[] = [];

    if (features.urgencyKeywords >= 2) {
        reasons.push('Multiple urgency keywords detected');
    }
    if (features.moneyKeywords >= 1) {
        reasons.push('Suspicious money-related claims');
    }
    if (features.capsRatio > 0.4) {
        reasons.push('Excessive capitalization (common in scams)');
    }
    if (features.exclamationCount > 3) {
        reasons.push('Excessive exclamation marks');
    }
    if (features.hasPhoneNumber && features.moneyKeywords > 0) {
        reasons.push('Phone number with money claims (typical scam pattern)');
    }

    if (reasons.length === 0) {
        reasons.push('No scam indicators detected');
    }

    return reasons;
};

/**
 * Get recommendation based on risk score
 */
const getRecommendation = (score: number): string => {
    if (score > 90) {
        return 'DO NOT CLICK. This appears to be a phishing attempt. Report and block immediately.';
    } else if (score > 70) {
        return 'Exercise extreme caution. Verify the source through official channels before proceeding.';
    } else if (score > 50) {
        return 'Suspicious characteristics detected. Proceed carefully and verify authenticity.';
    } else if (score > 30) {
        return 'Some risk indicators present. Verify source if unfamiliar.';
    } else {
        return 'No immediate threats detected. Standard security practices apply.';
    }
};

/**
 * Calculate overall trust score (0-100)
 * Based on recent scan history
 */
export const calculateTrustScore = async (userId: string): Promise<number> => {
    const recentScans = await getRecentScans(userId, 20);

    if (recentScans.length === 0) return 75; // Default neutral score

    const avgRisk = recentScans.reduce((sum, scan) => sum + scan.result.riskScore, 0) / recentScans.length;
    const threatsBlocked = recentScans.filter(s => s.result.isThreat && s.userAction === 'blocked').length;

    // Lower average risk = higher trust score
    let trustScore = 100 - avgRisk * 0.5;

    // Bonus for blocking threats
    trustScore += threatsBlocked * 2;

    return Math.min(Math.max(Math.round(trustScore), 0), 100);
};
