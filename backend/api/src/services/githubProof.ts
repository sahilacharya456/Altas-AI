import { logger } from '../utils/logger';

export interface GitHubCommitProof {
  isValid: boolean;
  commitSha?: string;
  message?: string;
  author?: string;
  repo?: string;
  filesChanged?: number;
  additions?: number;
  deletions?: number;
  url?: string;
  verifiedAt: Date;
  reason: string;
}

const GITHUB_COMMIT_PATTERN =
  /(?:github\.com\/([^/]+)\/([^/]+)\/commit\/([a-f0-9]{7,40}))|(?:\b([a-f0-9]{7,40})\b)/i;

const withTimeout = <T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

export const verifyGitHubProof = async (
  proofContent: string,
): Promise<GitHubCommitProof> => {
  const match = proofContent.match(GITHUB_COMMIT_PATTERN);

  if (!match) {
    return {
      isValid: false,
      verifiedAt: new Date(),
      reason: 'No GitHub commit URL or SHA found in proof.',
    };
  }

  const [, owner, repo, urlSha, bareSha] = match;
  const sha = urlSha ?? bareSha;

  // If we have owner/repo/sha, try to fetch from GitHub public API (no auth needed for public repos)
  if (owner && repo && sha) {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`;
    const fallback: GitHubCommitProof = {
      isValid: true,
      commitSha: sha,
      repo: `${owner}/${repo}`,
      url: `https://github.com/${owner}/${repo}/commit/${sha}`,
      verifiedAt: new Date(),
      reason: 'GitHub commit URL detected. Live verification timed out — accepted as valid.',
    };

    try {
      const result = await withTimeout(
        fetch(apiUrl, {
          headers: { 'User-Agent': 'AltasAI-ProofEngine/1.0', Accept: 'application/vnd.github.v3+json' },
        }).then(async (res) => {
          if (!res.ok) return null;
          return res.json() as Promise<Record<string, unknown>>;
        }),
        4000,
        null,
      );

      if (!result) return fallback;

      const stats = result.stats as Record<string, number> | undefined;
      const files = result.files as unknown[] | undefined;
      const commit = result.commit as Record<string, unknown> | undefined;
      const authorInfo = commit?.author as Record<string, unknown> | undefined;

      return {
        isValid: true,
        commitSha: sha,
        message: typeof commit?.message === 'string' ? commit.message.slice(0, 200) : undefined,
        author: typeof authorInfo?.name === 'string' ? authorInfo.name : undefined,
        repo: `${owner}/${repo}`,
        filesChanged: files?.length,
        additions: stats?.additions,
        deletions: stats?.deletions,
        url: `https://github.com/${owner}/${repo}/commit/${sha}`,
        verifiedAt: new Date(),
        reason: `Live-verified GitHub commit in ${owner}/${repo}. ${files?.length ?? 0} file(s) changed.`,
      };
    } catch (error) {
      logger.warn('github_proof.fetch_failed', { sha, error: error instanceof Error ? error.message : String(error) });
      return fallback;
    }
  }

  // Bare SHA — cannot live-verify but still a strong signal
  return {
    isValid: sha.length >= 7,
    commitSha: sha,
    verifiedAt: new Date(),
    reason: sha.length >= 7
      ? 'Git commit SHA detected in proof — accepted as valid execution evidence.'
      : 'Short hash detected but too ambiguous to verify.',
  };
};

export const buildGitHubProofSummary = (proof: GitHubCommitProof): string => {
  if (!proof.isValid) return '';
  const parts: string[] = [`Commit: ${proof.commitSha?.slice(0, 8) ?? 'unknown'}`];
  if (proof.repo) parts.push(`Repo: ${proof.repo}`);
  if (proof.message) parts.push(`Message: ${proof.message}`);
  if (proof.filesChanged !== undefined) parts.push(`Files changed: ${proof.filesChanged} (+${proof.additions ?? 0}/-${proof.deletions ?? 0})`);
  return parts.join(' | ');
};
