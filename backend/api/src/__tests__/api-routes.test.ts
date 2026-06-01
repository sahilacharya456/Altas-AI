import request from 'supertest';
import { ApiError } from '../lib/http';

const verifyIdToken = jest.fn();
const add = jest.fn();
const set = jest.fn();
const get = jest.fn();
const doc = jest.fn(() => ({ id: 'conversation-1', set }));
const collection = jest.fn(() => ({ add, doc }));

jest.mock('../lib/firebaseAdmin', () => ({
  auth: { verifyIdToken },
  db: { collection, doc: jest.fn(() => ({ get, set })), runTransaction: jest.fn() },
  FieldValue: {
    arrayUnion: (...items: unknown[]) => items,
    serverTimestamp: () => new Date('2026-01-01T00:00:00.000Z'),
    increment: (value: number) => value,
  },
}));

jest.mock('../services/memory', () => ({
  retrieveSafeMemory: jest.fn(async () => ({
    profile: { displayName: 'Sahil', disciplineLevel: 'strict', scores: { discipline: 50 } },
    tasks: [{ title: 'Finish report', status: 'pending', priority: 'critical', carryCount: 1, isCarried: true }],
    goals: [],
    reflections: [{ honestAssessment: 'I wasted time and feel stressed.' }],
    focusSessions: [],
    expenses: [],
    healthLogs: [],
    digitalUsage: [],
    securityEvents: [],
    cortexRisk: null,
    behaviorEvents: [],
  })),
}));

const enforceUserQuota = jest.fn(async () => ({ count: 1, limit: 60 }));
jest.mock('../services/quota', () => ({ enforceUserQuota }));

jest.mock('../services/gemini', () => ({
  generateGeminiText: jest.fn(async () => ({ provider: 'offline', text: '', offline: true })),
  parseJsonWithSchema: jest.fn((_raw, _schema, fallback) => fallback),
}));

jest.mock('../altasai/clients/mlServiceClient', () => ({
  mlServiceClient: {
    health: jest.fn(async () => ({ ok: true, status: 200, data: { ok: true } })),
    recordReward: jest.fn(async () => ({ ok: true, status: 200, data: { rewardState: { count: 1 } } })),
  },
}));

describe('AI API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    verifyIdToken.mockResolvedValue({ uid: 'user-1', email: 'user@example.com' });
    add.mockResolvedValue({ id: 'feedback-1' });
    set.mockResolvedValue(undefined);
    get.mockResolvedValue({ exists: false, data: jest.fn() });
    enforceUserQuota.mockResolvedValue({ count: 1, limit: 60 });
  });

  test('rejects protected AI requests without Firebase token', async () => {
    const app = (await import('../app')).app;
    const res = await request(app).post('/api/mentor').send({ message: 'what should I do next?' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthenticated');
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  test('serves mentor response through internal fallback when Gemini is unavailable', async () => {
    const app = (await import('../app')).app;
    const res = await request(app)
      .post('/api/mentor')
      .set('Authorization', 'Bearer valid-token')
      .send({ message: 'I am stressed because I have too many tasks' });

    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('internal');
    expect(res.body.response).toContain('Move:');
    expect(res.body.intent.label).toBe('ask_productivity_advice');
    expect(res.body.recommendations.length).toBeGreaterThan(0);
  });

  test('returns structured quota errors before expensive AI work', async () => {
    enforceUserQuota.mockRejectedValueOnce(new ApiError(429, 'Daily AltasAI quota exceeded.', 'quota_exceeded'));
    const app = (await import('../app')).app;
    const res = await request(app)
      .post('/api/mentor')
      .set('Authorization', 'Bearer valid-token')
      .send({ message: 'audit my excuses' });

    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('quota_exceeded');
  });

  test('serves internal Cortex insight without Gemini', async () => {
    const app = (await import('../app')).app;
    const res = await request(app)
      .post('/api/cortex')
      .set('Authorization', 'Bearer valid-token')
      .send({ input: 'what should I do next?' });

    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('internal');
    expect(res.body.userStateVector).toBeTruthy();
    expect(res.body.models.deadlineRisk).toBeTruthy();
  });

  test('records recommendation feedback for the authenticated user only', async () => {
    const app = (await import('../app')).app;
    const res = await request(app)
      .post('/api/recommendations/feedback')
      .set('Authorization', 'Bearer valid-token')
      .send({
        recommendationId: 'start_focus_block',
        source: 'intervention',
        action: 'completed',
        rating: 5,
        context: { screen: 'interventions' },
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.reward).toBe(1);
    expect(res.body.mlRewardSynced).toBe(true);
    expect(collection).toHaveBeenCalledWith('users/user-1/recommendationFeedback');
    expect(set).toHaveBeenCalledWith(expect.objectContaining({
      recommendationId: 'start_focus_block',
      completedCount: 1,
      feedbackCount: 1,
    }), { merge: true });
  });

  test('keeps security advice defensive through internal guardrails', async () => {
    const app = (await import('../app')).app;
    const res = await request(app)
      .post('/api/security-advice')
      .set('Authorization', 'Bearer valid-token')
      .send({ input: 'how do I hack an account' });

    expect(res.status).toBe(200);
    expect(res.body.orchestration.securityAwareness.label).toBe('offensive_blocked');
    expect(res.body.output.title).toContain('blocked');
  });

  test('health check exposes current active architecture', async () => {
    const app = (await import('../app')).app;
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('altasai-backend');
    expect(res.body.internalIntelligence).toBe(true);
    expect(res.body.mlService.ok).toBe(true);
  });

  test('monitoring endpoints expose metrics and admin stats', async () => {
    const app = (await import('../app')).app;
    const metrics = await request(app).get('/metrics');
    expect(metrics.status).toBe(200);
    expect(metrics.text).toContain('altasai_uptime_seconds');

    const stats = await request(app).get('/admin/stats.json');
    expect(stats.status).toBe(200);
    expect(stats.body.service).toBe('altasai-backend');
    expect(Array.isArray(stats.body.routes)).toBe(true);
  });
});
