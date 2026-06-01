/**
 * AltasAI Shield - Cyber Discipline Integration
 * Links security behavior to AltasAI discipline scoring
 */

import { Timestamp } from '../firebase';
import { setDocument } from '../firebase/firestore';
import { getRecentScans } from './analysis';

export interface CyberDisciplineMetrics {
    threatsIgnored: number; // Proceeded despite warnings
    threatsBlocked: number; // Heeded warnings
    riskTakingScore: number; // 0-100 (100 = maximum risk-taking)
    disciplineImpact: number; // Points to adjust AltasAI discipline score
}

export interface CyberDisciplineLog {
    id: string;
    userId: string;
    period: 'week' | 'month';
    threatsIgnored: number;
    threatsBlocked: number;
    riskTakingScore: number;
    disciplineImpact: number;
    mentorEscalation: boolean;
    timestamp: Timestamp;
}

/**
 * Calculate cyber discipline metrics
 */
export const calculateCyberDiscipline = async (
    userId: string,
    timeframe: 'week' | 'month' = 'week'
): Promise<CyberDisciplineMetrics> => {
    const scans = await getRecentScans(userId, 100);

    // Filter by timeframe
    const cutoffDate = new Date();
    if (timeframe === 'week') {
        cutoffDate.setDate(cutoffDate.getDate() - 7);
    } else {
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
    }

    const recentScans = scans.filter(s =>
        s.scanDate?.toDate() > cutoffDate
    );

    // Count behaviors
    const threatsIgnored = recentScans.filter(s =>
        s.result.isThreat && s.userAction === 'proceeded'
    ).length;

    const threatsBlocked = recentScans.filter(s =>
        s.result.isThreat && s.userAction === 'blocked'
    ).length;

    // Risk-taking score
    const totalThreats = threatsIgnored + threatsBlocked;
    const riskTakingScore = totalThreats > 0
        ? (threatsIgnored / totalThreats) * 100
        : 0;

    // Discipline impact calculation
    let disciplineImpact = 0;

    // Positive reinforcement
    if (threatsBlocked > 5) {
        disciplineImpact += 2; // Bonus for good security hygiene
    }

    // Penalties
    if (threatsIgnored > 3) {
        disciplineImpact -= 5; // Penalty for ignoring warnings
    }

    if (riskTakingScore > 70) {
        disciplineImpact -= 3; // Additional penalty for high risk-taking
    }

    // Severe negligence
    if (threatsIgnored > 10) {
        disciplineImpact -= 10; // Major penalty
    }

    return {
        threatsIgnored,
        threatsBlocked,
        riskTakingScore,
        disciplineImpact,
    };
};

/**
 * Log cyber discipline metrics to Firestore
 */
export const logCyberDiscipline = async (
    userId: string,
    metrics: CyberDisciplineMetrics,
    period: 'week' | 'month'
): Promise<void> => {
    const logId = `${userId}_${period}_${Date.now()}`;

    const mentorEscalation = metrics.threatsIgnored > 3;

    await setDocument<Partial<CyberDisciplineLog>>(`cyberDisciplineLogs/${logId}`, {
        userId,
        period,
        threatsIgnored: metrics.threatsIgnored,
        threatsBlocked: metrics.threatsBlocked,
        riskTakingScore: metrics.riskTakingScore,
        disciplineImpact: metrics.disciplineImpact,
        mentorEscalation,
        timestamp: Timestamp.now(),
    });
};

/**
 * Get strict AI mentor prompt for repeated negligence
 */
export const getStrictMentorPrompt = (metrics: CyberDisciplineMetrics): string => {
    if (metrics.threatsIgnored <= 2) {
        return ''; // No escalation needed
    }

    return `
⚠️ USER HAS IGNORED MULTIPLE SECURITY WARNINGS

Security Behavior Analysis:
- Threats blocked: ${metrics.threatsBlocked}
- Threats ignored: ${metrics.threatsIgnored}
- Risk-taking score: ${Math.round(metrics.riskTakingScore)}/100

Your response must be STRICT and DIRECT:
- Start with: "You have ignored ${metrics.threatsIgnored} security warnings."
- Explain consequences of this behavior
- Use firm language ("This is unacceptable", "You must stop")
- Connect to AltasAI discipline score impact (${metrics.disciplineImpact} points)
- Provide clear ultimatum if needed

Example Response:
"You have ignored ${metrics.threatsIgnored} security warnings this ${metrics.threatsIgnored > 10 ? 'month' : 'week'}. This behavior is unacceptable.

CONSEQUENCES:
- Your AltasAI discipline score has decreased by ${Math.abs(metrics.disciplineImpact)} points
- You are exposing yourself to data theft, account compromise, and financial loss
- Ignoring phishing warnings = inviting attackers

REQUIRED ACTIONS:
1. Review all blocked threats in Security Dashboard
2. Complete Security Awareness Module (mandatory)
3. Enable 2FA on all accounts
4. No exceptions - follow security guidance

${metrics.threatsIgnored > 10 ? 'Your next ignored warning will trigger a 7-day AltasAI lockout for your safety.' : 'Continue this behavior and you will face account restrictions.'}"

Provide a professional but stern security assessment.
`;
};

/**
 * Check if mentor escalation is needed
 */
export const shouldEscalateMentor = async (userId: string): Promise<boolean> => {
    const metrics = await calculateCyberDiscipline(userId, 'week');
    return metrics.threatsIgnored > 3;
};

/**
 * Get cyber discipline summary for user profile
 */
export const getCyberDisciplineSummary = async (userId: string): Promise<{
    weeklyMetrics: CyberDisciplineMetrics;
    monthlyMetrics: CyberDisciplineMetrics;
    overallRating: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}> => {
    const [weeklyMetrics, monthlyMetrics] = await Promise.all([
        calculateCyberDiscipline(userId, 'week'),
        calculateCyberDiscipline(userId, 'month'),
    ]);

    // Overall rating
    let overallRating: 'excellent' | 'good' | 'needs-improvement' | 'poor';

    if (weeklyMetrics.threatsIgnored === 0 && weeklyMetrics.threatsBlocked > 0) {
        overallRating = 'excellent';
    } else if (weeklyMetrics.riskTakingScore < 30) {
        overallRating = 'good';
    } else if (weeklyMetrics.riskTakingScore < 60) {
        overallRating = 'needs-improvement';
    } else {
        overallRating = 'poor';
    }

    return {
        weeklyMetrics,
        monthlyMetrics,
        overallRating,
    };
};
