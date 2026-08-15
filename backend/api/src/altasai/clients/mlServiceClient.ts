import { z } from 'zod';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { getTraceId } from '../../middleware/traceContext';

export interface MlServiceResult<T> {
  ok: boolean;
  data?: T;
  fallbackReason?: string;
  status?: number;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

const IntentSchema = z.object({
  label: z.string(),
  confidence: z.number(),
  top3: z.array(z.object({ label: z.string(), confidence: z.number() })),
  model: z.string(),
  fallbackRecommended: z.boolean()
});

const EntitySchema = z.object({
  entities: z.array(z.object({ type: z.string(), value: z.unknown(), raw: z.string(), confidence: z.number() })),
  confidence: z.number(),
  missingFields: z.array(z.string()),
  clarificationNeeded: z.boolean()
});

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

// Circuit breaker configuration
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT_MS = 30_000; // 30 seconds
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;

export class MlServiceClient {
  private circuitBreaker: CircuitBreakerState = {
    failures: 0,
    lastFailure: 0,
    state: 'closed',
  };

  constructor(
    private readonly baseUrl = env.mlServiceBaseUrl,
    private readonly timeoutMs = env.mlServiceTimeoutMs
  ) {}

  private checkCircuitBreaker(): boolean {
    const now = Date.now();
    
    if (this.circuitBreaker.state === 'open') {
      if (now - this.circuitBreaker.lastFailure > CIRCUIT_BREAKER_TIMEOUT_MS) {
        logger.info('ml_service.circuit_breaker_half_open');
        this.circuitBreaker.state = 'half-open';
        return true;
      }
      return false;
    }
    return true;
  }

  private recordSuccess(): void {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'closed';
  }

  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();
    
    if (this.circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitBreaker.state = 'open';
      logger.warn('ml_service.circuit_breaker_opened', { 
        failures: this.circuitBreaker.failures 
      });
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async requestWithRetry<T>(
    path: string, 
    body?: Record<string, unknown>, 
    method = body ? 'POST' : 'GET',
    attempt = 0
  ): Promise<MlServiceResult<T>> {
    if (!this.checkCircuitBreaker()) {
      return { 
        ok: false, 
        fallbackReason: 'Circuit breaker open - ML service unavailable' 
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    const traceId = getTraceId();
    const headers: Record<string, string> = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (traceId) headers['x-trace-id'] = traceId;

    try {
      const response = await fetch(`${this.baseUrl}${safePath(path)}`, {
        method,
        headers: Object.keys(headers).length ? headers : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        this.recordFailure();
        const fallbackReason = `ML service returned ${response.status}`;
        
        // Retry on 5xx errors
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          logger.warn('ml_service.retrying', { 
            attempt: attempt + 1, 
            maxRetries: MAX_RETRIES,
            delayMs: delay,
            status: response.status 
          });
          await this.sleep(delay);
          return this.requestWithRetry(path, body, method, attempt + 1);
        }
        
        return { ok: false, status: response.status, fallbackReason };
      }

      this.recordSuccess();
      return { ok: true, data: payload as T, status: response.status };
    } catch (error) {
      this.recordFailure();
      const fallbackReason = error instanceof Error ? error.message : String(error);
      
      // Retry on network errors
      if (attempt < MAX_RETRIES && 
          (error instanceof TypeError || // network error
           error instanceof DOMException || // abort
           (error instanceof Error && error.name === 'AbortError'))) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        logger.warn('ml_service.retrying', { 
          attempt: attempt + 1, 
          maxRetries: MAX_RETRIES,
          delayMs: delay,
          error: fallbackReason 
        });
        await this.sleep(delay);
        return this.requestWithRetry(path, body, method, attempt + 1);
      }
      
      logger.warn('ml_service.unavailable', { fallbackReason, attempt: attempt + 1 });
      return { ok: false, fallbackReason };
    } finally {
      clearTimeout(timeout);
    }
  }

  async request<T>(path: string, body?: Record<string, unknown>, method = body ? 'POST' : 'GET'): Promise<MlServiceResult<T>> {
    return this.requestWithRetry(path, body, method);
  }

  getCircuitBreakerState(): CircuitBreakerState {
    return { ...this.circuitBreaker };
  }

  health() {
    return this.request<{ ok: boolean; service: string }>('/health', undefined, 'GET');
  }

  predictIntent(text: string) {
    return this.request<MlIntentPrediction>('/predict/intent', { text }).then(res => res.ok && res.data ? { ...res, data: IntentSchema.parse(res.data) } : res);
  }

  predictEntities(text: string) {
    return this.request<MlEntityPrediction>('/predict/entities', { text }).then(res => res.ok && res.data ? { ...res, data: EntitySchema.parse(res.data) } : res);
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