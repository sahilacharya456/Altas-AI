/**
 * Mood Adaptor Service
 * Derives user emotional state from behavioral data to tune AI persona.
 */

import { BehavioralPattern } from './intelligence';

export type MoodState = 'STRESSED' | 'MOTIVATED' | 'BURNOUT_RISK' | 'COMPLACENT' | 'BALANCED';
export type ToneRecommendation = 'SUPPORTIVE' | 'CHALLENGING' | 'STRICT' | 'EMPATHETIC';

export interface EmotionalState {
    mood: MoodState;
    tone: ToneRecommendation;
    reason: string[];
}

interface ToneContext {
    finance: {
        netBalance: number;
        overdueCount: number;
    };
    security: {
        trustScore: number;
    };
    behavior: BehavioralPattern;
}

/**
 * key breakdown:
 * - BURNOUT_RISK: High output, low energy/mood
 * - STRESSED: Environmental stressors (money, security)
 * - COMPLACENT: High mood, declining output
 * - MOTIVATED: High/Improving output, good energy
 * - BALANCED: Normal operation
 */
export const analyzeEmotionalState = (context: ToneContext): EmotionalState => {
    const { finance, security, behavior } = context;
    const reasons: string[] = [];

    // 1. Check for BURNOUT RISK
    // High activity streak but declining energy or low mood
    const isHighActivity = behavior.reflectionConsistency.streak > 5;
    const isDraining = behavior.reflectionConsistency.energyTrend === 'decreasing' || behavior.reflectionConsistency.averageMood < 3;

    if (isHighActivity && isDraining) {
        reasons.push('High consistency but declining energy detected.');
        return {
            mood: 'BURNOUT_RISK',
            tone: 'SUPPORTIVE',
            reason: reasons
        };
    }

    // 2. Check for STRESS (Environmental)
    // Financial urgency or Security threats
    if (finance.netBalance < -1000 || finance.overdueCount > 0) {
        reasons.push(`Financial strain detected (₹${finance.netBalance}).`);
    }
    if (security.trustScore < 50) {
        reasons.push('Critical security vulnerability.');
    }

    if (reasons.length > 0) {
        return {
            mood: 'STRESSED',
            tone: 'EMPATHETIC',
            reason: reasons
        };
    }

    // 3. Check for COMPLACENCY
    // Good mood but slipping performance
    const isSlacking = behavior.completionTrend.direction === 'declining' || behavior.completionTrend.thisWeek < 50;
    const isHappy = behavior.reflectionConsistency.averageMood > 3.5;

    if (isSlacking && isHappy) {
        reasons.push('High mood but declining task completion.');
        return {
            mood: 'COMPLACENT',
            tone: 'STRICT',
            reason: reasons
        };
    }

    // 4. Check for MOTIVATION
    // Improving trend or generally high performance
    if (behavior.completionTrend.direction === 'improving' || behavior.completionTrend.thisWeek > 80) {
        reasons.push('Improving performance trend detected.');
        return {
            mood: 'MOTIVATED',
            tone: 'CHALLENGING', // Push them to the next level
            reason: reasons
        };
    }

    // 5. Default: BALANCED
    return {
        mood: 'BALANCED',
        tone: 'CHALLENGING', // AltasAI default is to push
        reason: ['Systems nominal.']
    };
};
