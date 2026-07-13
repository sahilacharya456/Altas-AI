import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface MlServiceResult<T> {
  ok: boolean;
  data?: T;
  fallbackReason?: string;
  status?: number;
}

export interface MlIntentPrediction {
  label: string;
  confidence: number;
  top3: Array<{ label: string; confidence: number }>;
  model: string;
  fallbackRecommended: boolean;
}

export interface MlEntityPrediction {
  entities: Array<{ type: string; value: unknown; raw: string; confidence: number }>;
  confidence: number;
  missingFields: string[];
  clarificationNeeded: boolean;
}

export interface MlReflectionPrediction {
  sentimentScore: number;
  emotionLabels: string[];
  stressScore: number;
  motivationScore: number;
  blockers: string[];
  wins: string[];
  themes: string[];
  recommendedIntervention: string;
}

export interface MlRecommendation {
  topRecommendation: string;
  top3Recommendations: string[];
  rankingScores: Record<string, number>;
  reason: string;
  confidence: number;
  expectedBenefit: string;
  nextAction: string;
  suggestedTask?: unknown;
}

export interface MlRagResult {
  retrievedContext: string[];
  sourceIds: (string | null)[];
  relevanceScores: number[];
  evidenceSummary: string;
  contextForMentor: string;
  citations: unknown[];
  hasResults: boolean;
}

export interface MlReflectionResult {
  sentimentScore: number;
  emotionLabels: string[];
  stressScore: number;
  motivationScore: number;
  confidenceScore: number;
  burnoutRiskSignal: number;
  blockers: string[];
  wins: string[];
  themes: string[];
  recommendedIntervention: string;
}

const safePath = (path: string) => path.startsWith('/') ? path : `/${path}`;

export class MlServiceClient {
  constructor(
    private readonly baseUrl = env.mlServiceBaseUrl,
    private readonly timeoutMs = env.mlServiceTimeoutMs
  ) {}

  async request<T>(path: string, body?: Record<string, unknown>, method = body ? 'POST' : 'GET'): Promise<MlServiceResult<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${safePath(path)}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        return { ok: false, status: response.status, fallbackReason: `ML service returned ${response.status}` };
      }

      return { ok: true, data: payload as T, status: response.status };
    } catch (error) {
      const fallbackReason = error instanceof Error ? error.message : String(error);
      logger.warn('ml_service.unavailable', { fallbackReason });
      return { ok: false, fallbackReason };
    } finally {
      clearTimeout(timeout);
    }
  }

  health() {
    return this.request<{ ok: boolean; service: string }>('/health', undefined, 'GET');
  }

  predictIntent(text: string) {
    return this.request<MlIntentPrediction>('/predict/intent', { text });
  }

  predictEntities(text: string) {
    return this.request<MlEntityPrediction>('/predict/entities', { text });
  }

  predictReflection(text: string) {
    return this.request<MlReflectionPrediction>('/predict/reflection', { text });
  }

  recommendAction(userId: string, context: Record<string, unknown>) {
    return this.request<MlRecommendation>('/recommend/action', { userId, context });
  }

  recordReward(userId: string, action: string, reward: number) {
    return this.request('/recommend/reward', { userId, action, reward });
  }

  queryRag(query: string, topK = 3) {
    return this.request<MlRagResult>('/rag/query', { query, topK });
  }

  queryRagForUser(userId: string, query: string, topK = 3) {
    return this.request<MlRagResult>('/rag/query/user', { userId, query, topK });
  }

  indexUserMemory(userId: string, documents: Array<{ id: string; text: string; metadata?: Record<string, unknown> }>) {
    return this.request<{ indexed: number; userId: string }>('/rag/index/user', { userId, documents });
  }

  analyzeReflection(text: string) {
    return this.request<MlReflectionResult>('/predict/reflection', { text });
  }

  analyzeVision(payload: Record<string, unknown>) {
    return this.request('/vision/analyze', payload);
  }

  runEvaluation() {
    return this.request('/evaluate/run', {});
  }
}

export const mlServiceClient = new MlServiceClient();
