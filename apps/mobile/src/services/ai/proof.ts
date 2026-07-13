import { callBackend } from './backendClient';

export type ProofType = 'text' | 'screenshot' | 'github_link' | 'file' | 'study_notes' | 'other';
export type ProofStatus = 'verified' | 'weak' | 'rejected';

export interface ProofReviewResult {
  status: ProofStatus;
  verdict: string;
  feedbackToUser: string;
  score: number;
  offline: boolean;
  provider: 'gemini' | 'internal';
}

const OFFLINE_WEAK_RESPONSE: ProofReviewResult = {
  status: 'weak',
  verdict: 'Proof submitted but could not be reviewed - mentor is offline.',
  feedbackToUser: 'Your proof looks weak. Give me a more specific summary - what exactly did you complete? A GitHub commit, a file name, or exact output.',
  score: 35,
  offline: true,
  provider: 'internal',
};

export const reviewProof = async (
  taskId: string,
  taskTitle: string,
  proofType: ProofType,
  proofContent: string,
): Promise<ProofReviewResult> => {
  try {
    return await callBackend<ProofReviewResult>('/api/proof-review', {
      taskId,
      taskTitle,
      proofType,
      proofContent,
    });
  } catch {
    return OFFLINE_WEAK_RESPONSE;
  }
};
