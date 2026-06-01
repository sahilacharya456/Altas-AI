import type { InternalAIResult } from '../core/types';
import { defensiveSecurityPattern, offensiveSecurityPattern } from '../regex/securityPatterns';

export const assessSecurityAwareness = (input: string): InternalAIResult<'defensive_help' | 'offensive_blocked' | 'normal'> => {
  if (offensiveSecurityPattern.test(input)) {
    return {
      label: 'offensive_blocked',
      score: 95,
      confidence: 0.9,
      reasons: ['Offensive cybersecurity language detected.'],
      evidence: ['offensive_security_pattern'],
      recommendation: 'Refuse offensive guidance and redirect to defensive account safety.',
      nextAction: 'Ask for defensive context such as phishing, passwords, or account recovery.',
    };
  }
  if (defensiveSecurityPattern.test(input)) {
    return {
      label: 'defensive_help',
      score: 55,
      confidence: 0.78,
      reasons: ['Defensive security concern detected.'],
      evidence: ['defensive_security_pattern'],
      recommendation: 'Give safe verification steps only.',
      nextAction: 'Verify source, avoid sharing credentials, and use official recovery paths.',
    };
  }
  return {
    label: 'normal',
    score: 15,
    confidence: 0.55,
    reasons: ['No security-specific concern detected.'],
    evidence: ['no_security_pattern'],
    recommendation: 'No security intervention required.',
    nextAction: 'Continue normal productivity flow.',
  };
};
