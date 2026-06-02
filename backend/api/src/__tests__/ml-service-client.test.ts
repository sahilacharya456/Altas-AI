import { MlServiceClient } from '../altasai/clients/mlServiceClient';
import { runAltasAIOrchestratorWithML } from '../altasai/core/orchestrator';
import type { SafeUserMemory } from '../services/memory';

const memory: SafeUserMemory = {
  profile: null,
  tasks: [{ title: 'Finish report', status: 'pending', priority: 'critical', isCarried: true }],
  goals: [],
  reflections: [{ honestAssessment: 'I am stressed and delaying.' }],
  focusSessions: [],
  expenses: [],
  healthLogs: [],
  digitalUsage: [],
  securityEvents: [],
  cortexRisk: null,
  behaviorEvents: [],
};

describe('ML service client', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns structured fallback when Python service is unavailable', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('connection refused'));
    const client = new MlServiceClient('http://127.0.0.1:65530', 50);

    const result = await client.predictIntent('start focus for 25 minutes');
    expect(result.ok).toBe(false);
    expect(result.fallbackReason).toContain('connection refused');
  });

  test('parses successful intent prediction responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        label: 'start_focus',
        confidence: 0.91,
        top3: [{ label: 'start_focus', confidence: 0.91 }],
        model: 'tfidf_logistic_regression',
        fallbackRecommended: false,
      }),
    } as Response);
    const client = new MlServiceClient('http://ml-service.local', 1000);

    const result = await client.predictIntent('start focus for 25 minutes');
    expect(result.ok).toBe(true);
    expect(result.data?.label).toBe('start_focus');
  });

  test('orchestrator keeps TypeScript intelligence when ML service fails', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));
    const result = await runAltasAIOrchestratorWithML({
      userId: 'user-1',
      message: 'what should I do next?',
      memory,
    });

    expect(result.intent.label).not.toBe('unknown');
    expect(result.mlService.fallbackUsed).toBe(true);
    expect(result.mlService.used).toBe(false);
  });
});
