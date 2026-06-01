import type { SafetyGuardrailResult } from '../core/types';
import { medicalDiagnosisPattern } from '../regex/healthPatterns';
import { offensiveSecurityPattern } from '../regex/securityPatterns';

export const runSafetyGuardrail = (input: string): SafetyGuardrailResult => {
  const text = input.toLowerCase();
  if (offensiveSecurityPattern.test(text)) {
    return {
      safetyLabel: 'offensive_cybersecurity',
      allowedResponseType: 'refusal',
      instruction: 'Refuse offensive cybersecurity help and offer defensive account-safety guidance.',
      confidence: 0.9,
      evidence: ['offensive cybersecurity pattern'],
    };
  }
  if (medicalDiagnosisPattern.test(text)) {
    return {
      safetyLabel: 'medical_boundary',
      allowedResponseType: 'bounded_guidance',
      instruction: 'Do not diagnose or prescribe. Provide general productivity/wellbeing boundary guidance and suggest qualified help for health concerns.',
      confidence: 0.84,
      evidence: ['medical diagnosis pattern'],
    };
  }
  if (/\b(kill myself|suicide|self harm|hurt myself|end my life)\b/i.test(text)) {
    return {
      safetyLabel: 'crisis_language',
      allowedResponseType: 'supportive_redirect',
      instruction: 'Respond supportively, encourage immediate local emergency or crisis support, and avoid productivity coaching as the primary answer.',
      confidence: 0.92,
      evidence: ['crisis language'],
    };
  }
  if (/\b(password|otp|token|secret|api key|private key)\b/i.test(text)) {
    return {
      safetyLabel: 'privacy_sensitive',
      allowedResponseType: 'bounded_guidance',
      instruction: 'Avoid storing or repeating secrets. Tell the user to rotate exposed credentials and use official account recovery.',
      confidence: 0.76,
      evidence: ['privacy sensitive term'],
    };
  }
  return {
    safetyLabel: 'allowed',
    allowedResponseType: 'normal',
    instruction: 'Normal productivity guidance is allowed. Stay concrete and do not make unsupported claims.',
    confidence: 0.64,
    evidence: ['no blocking safety pattern'],
  };
};
