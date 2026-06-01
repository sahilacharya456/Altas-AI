/**
 * AltasAI Shield - Social Engineering Detector
 * NLP-based detection of manipulation tactics
 */

export interface SocialEngineeringTactic {
    type: 'urgency' | 'authority' | 'fear' | 'greed' | 'curiosity';
    confidence: number; // 0-1
    examples: string[];
}

export interface SocialEngineeringAnalysis {
    riskScore: number; // 0-100
    tactics: SocialEngineeringTactic[];
    manipulation: {
        emotionalTriggers: string[];
        pressureTactics: string[];
        trustExploitation: string[];
    };
    verdict: 'safe' | 'suspicious' | 'high-risk';
    explanation: string;
    actionSteps: string[];
}

/**
 * Detect social engineering tactics in text
 */
export const detectSocialEngineering = (text: string): SocialEngineeringAnalysis => {
    const tactics: SocialEngineeringTactic[] = [];
    let riskScore = 0;

    // 1. URGENCY Detection
    const urgencyPatterns = [
        /urgent/i, /immediately/i, /act now/i, /limited time/i,
        /expires/i, /deadline/i, /hurry/i, /quick/i, /asap/i,
        /today only/i, /last chance/i, /don't miss/i,
    ];
    const urgencyMatches = urgencyPatterns.filter(p => p.test(text));
    if (urgencyMatches.length >= 2) {
        riskScore += 25;
        tactics.push({
            type: 'urgency',
            confidence: Math.min(urgencyMatches.length / 4, 1),
            examples: ['Multiple urgency keywords detected'],
        });
    }

    // 2. AUTHORITY Abuse
    const authorityPatterns = [
        /bank manager/i, /ceo/i, /government/i, /police/i,
        /from your bank/i, /tax department/i, /security team/i,
        /official/i, /authorized/i, /administrator/i,
        /customer service/i, /support team/i,
    ];
    const authorityMatches = authorityPatterns.filter(p => p.test(text));
    if (authorityMatches.length > 0) {
        riskScore += 30;
        tactics.push({
            type: 'authority',
            confidence: 0.75,
            examples: ['Claims to be from authority figure or organization'],
        });
    }

    // 3. FEAR Tactics
    const fearPatterns = [
        /account (will be )?suspended/i, /blocked/i, /terminated/i,
        /legal action/i, /arrest warrant/i, /penalties/i,
        /suspended/i, /locked out/i, /compromised/i,
        /fraud detected/i, /security breach/i, /hacked/i,
    ];
    const fearMatches = fearPatterns.filter(p => p.test(text));
    if (fearMatches.length > 0) {
        riskScore += 35;
        tactics.push({
            type: 'fear',
            confidence: 0.85,
            examples: ['Uses fear to pressure immediate action'],
        });
    }

    // 4. GREED Exploitation
    const greedPatterns = [
        /you('ve | have )?won/i, /prize/i, /lottery/i, /cash reward/i,
        /₹\d{4,}/i, /free money/i, /claim .*prize/i,
        /congratulations/i, /selected/i, /winner/i,
    ];
    const greedMatches = greedPatterns.filter(p => p.test(text));
    if (greedMatches.length > 0) {
        riskScore += 30;
        tactics.push({
            type: 'greed',
            confidence: 0.9,
            examples: ['Promises unrealistic financial gain'],
        });
    }

    // 5. CURIOSITY Bait
    const curiosityPatterns = [
        /click here to see/i, /you won't believe/i, /shocking/i,
        /secret/i, /exclusive/i, /limited offer/i,
        /find out/i, /discover/i,
    ];
    const curiosityMatches = curiosityPatterns.filter(p => p.test(text));
    if (curiosityMatches.length > 0) {
        riskScore += 15;
        tactics.push({
            type: 'curiosity',
            confidence: 0.6,
            examples: ['Uses curiosity to entice clicking'],
        });
    }

    // Emotional Triggers
    const emotionalTriggers: string[] = [];
    const exclamationCount = (text.match(/!/g) || []).length;
    if (exclamationCount >= 3) {
        emotionalTriggers.push('Excessive exclamation marks');
    }
    if (text.toUpperCase() === text && text.length > 20) {
        emotionalTriggers.push('All caps (shouting)');
    }
    if (urgencyMatches.length > 0) {
        emotionalTriggers.push('Time pressure');
    }

    // Pressure Tactics
    const pressureTactics: string[] = [];
    if (urgencyMatches.length >= 2) {
        pressureTactics.push('Creates artificial urgency');
    }
    if (fearMatches.length > 0) {
        pressureTactics.push('Threatens negative consequences');
    }

    // Trust Exploitation
    const trustExploitation: string[] = [];
    if (authorityMatches.length > 0) {
        trustExploitation.push('Impersonates trusted entity');
    }
    if (text.match(/confirm your (password|account|details|information)/i)) {
        trustExploitation.push('Requests sensitive information');
    }
    if (text.match(/verify your (identity|account|card)/i)) {
        trustExploitation.push('Requests verification (common phishing)');
    }

    // Verdict
    const verdict = riskScore > 70 ? 'high-risk' :
        riskScore > 40 ? 'suspicious' : 'safe';

    // Explanation
    const explanation = generateExplanation(tactics, riskScore);

    // Action Steps
    const actionSteps = generateActionSteps(verdict, tactics);

    return {
        riskScore: Math.min(riskScore, 100),
        tactics,
        manipulation: {
            emotionalTriggers,
            pressureTactics,
            trustExploitation,
        },
        verdict,
        explanation,
        actionSteps,
    };
};

function generateExplanation(tactics: SocialEngineeringTactic[], score: number): string {
    if (tactics.length === 0) {
        return 'No significant social engineering tactics detected.';
    }

    const tacticNames = tactics.map(t => {
        switch (t.type) {
            case 'urgency': return 'urgency';
            case 'authority': return 'authority abuse';
            case 'fear': return 'fear tactics';
            case 'greed': return 'greed exploitation';
            case 'curiosity': return 'curiosity bait';
        }
    });

    if (score > 80) {
        return `This message exhibits ${tactics.length} social engineering tactics: ${tacticNames.join(', ')}. HIGH RISK of manipulation attempt.`;
    } else if (score > 50) {
        return `Multiple manipulation indicators detected (${tacticNames.join(', ')}). Exercise caution when responding.`;
    } else {
        return `Some suspicious characteristics detected (${tacticNames.join(', ')}). Standard verification recommended.`;
    }
}

function generateActionSteps(verdict: string, tactics: SocialEngineeringTactic[]): string[] {
    const steps: string[] = [];

    if (verdict === 'high-risk') {
        steps.push('DO NOT respond or click any links');
        steps.push('Delete the message immediately');
        steps.push('Block the sender');

        if (tactics.some(t => t.type === 'authority')) {
            steps.push('If claiming to be from bank/authority, verify through official channels');
            steps.push('Call the organization using number from their official website (not from message)');
        }

        if (tactics.some(t => t.type === 'greed')) {
            steps.push('Legitimate prizes never require payment or personal information upfront');
        }
    } else if (verdict === 'suspicious') {
        steps.push('Verify sender identity through official channels');
        steps.push('Do not provide personal information');
        steps.push('Be skeptical of urgent requests');
        steps.push('Check for spelling/grammar errors (common in scams)');
    } else {
        steps.push('Standard security practices apply');
        steps.push('Verify unusual requests independently');
        steps.push('Never share passwords or OTPs');
    }

    return steps;
}

/**
 * Combine with existing text analysis for comprehensive scoring
 */
export const enhanceTextAnalysis = (text: string, baseRiskScore: number): {
    combinedScore: number;
    socialEngineering: SocialEngineeringAnalysis;
} => {
    const socialEngineering = detectSocialEngineering(text);

    // Combine scores (weighted average: 60% social engineering, 40% base)
    const combinedScore = Math.round(
        socialEngineering.riskScore * 0.6 + baseRiskScore * 0.4
    );

    return {
        combinedScore,
        socialEngineering,
    };
};
