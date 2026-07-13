import request from 'supertest';
import { ApiError } from '../lib/http';

const verifyIdToken = jest.fn();
const add = jest.fn();
const set = jest.fn();
const get = jest.fn();
const doc = jest.fn(() => ({ id: 'conversation-1', set }));
const dbDoc = jest.fn(() => ({ get, set }));
const collection = jest.fn(() => ({ add, doc }));

jest.mock('../lib/firebaseAdmin', () => ({
  auth: { verifyIdToken },
  db: { collection, doc: dbDoc, runTransaction: jest.fn() },
  FieldValue: {
    arrayUnion: (...items: unknown[]) => items,
    serverTimestamp: () => new Date('2026-01-01T00:00:00.000Z'),
    increment: (value: number) => value,
  },
  Timestamp: {
    fromDate: (date: Date) => ({ toDate: () => date, seconds: Math.floor(date.getTime() / 1000) }),
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
    ragContext: undefined,
    reflectionAnalysis: undefined,
  })),
}));

jest.mock('../services/conversation', () => ({
  retrieveConversationHistory: jest.fn(async () => []),
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
    predictIntent: jest.fn(async () => ({ ok: false, fallbackReason: 'ml offline in test' })),
    predictEntities: jest.fn(async () => ({ ok: false, fallbackReason: 'ml offline in test' })),
    recommendAction: jest.fn(async () => ({ ok: false, fallbackReason: 'ml offline in test' })),
    analyzeReflection: jest.fn(async () => ({ ok: false, fallbackReason: 'ml offline in test' })),
    indexUserMemory: jest.fn(async () => ({ ok: false, fallbackReason: 'ml offline in test' })),
    queryRagForUser: jest.fn(async () => ({ ok: false, fallbackReason: 'ml offline in test' })),
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

  test('allows Expo dev CORS preflight from localhost 8082', async () => {
    const app = (await import('../app')).app;
    const res = await request(app)
      .options('/api/mentor')
      .set('Origin', 'http://localhost:8082')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:8082');
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
    expect(Array.isArray(res.body.actions)).toBe(true);
  });

  test('mentor agent executes explicit low-risk task creation', async () => {
    const app = (await import('../app')).app;
    const res = await request(app)
      .post('/api/mentor')
      .set('Authorization', 'Bearer valid-token')
      .send({ message: 'create task to finish project report in 30 minutes today' });

    expect(res.status).toBe(200);
    expect(res.body.actions).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'create_task',
        status: 'executed',
        risk: 'low',
      }),
    ]));
    expect(collection).toHaveBeenCalledWith('users/user-1/tasks');
    expect(add).toHaveBeenCalledWith(expect.objectContaining({
      title: 'finish project report in 30 minutes',
      source: 'AI',
      tags: ['mentor-agent'],
      estimatedMinutes: 30,
    }));
    expect(res.body.response).toContain('Agent action: created 1 task');
  });

  test('refuses out-of-context mentor requests before quota and AI work', async () => {
    const app = (await import('../app')).app;
    const res = await request(app)
      .post('/api/mentor')
      .set('Authorization', 'Bearer valid-token')
      .send({ message: 'tell me a joke about movies' });

    expect(res.status).toBe(200);
    expect(res.body.response).toBe('sorry this is out of context for me');
    expect(res.body.provider).toBe('internal');
    expect(enforceUserQuota).not.toHaveBeenCalled();
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

  test('proof-review rejects trivially short proof without calling Gemini', async () => {
    const app = (await import('../app')).app;
    const res = await request(app)
      .post('/api/proof-review')
      .set('Authorization', 'Bearer valid-token')
      .send({ taskId: 'task-1', taskTitle: 'Finish project report', proofType: 'text', proofContent: 'done' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('rejected');
    expect(res.body.provider).toBe('internal');
    expect(res.body.feedbackToUser).toContain('weak');
  });

  test('proof-review returns weak status when Gemini is offline', async () => {
    const app = (await import('../app')).app;
    const res = await request(app)
      .post('/api/proof-review')
      .set('Authorization', 'Bearer valid-token')
      .send({
        taskId: 'task-1',
        taskTitle: 'Write authentication module',
        proofType: 'text',
        proofContent: 'I wrote the auth module with JWT tokens and tested it.',
      });

    expect(res.status).toBe(200);
    expect(['verified', 'weak', 'rejected']).toContain(res.body.status);
    expect(res.body.feedbackToUser).toBeTruthy();
    expect(res.body.score).toBeGreaterThanOrEqual(0);
  });

  test('proof-review persists result to task document', async () => {
    const app = (await import('../app')).app;
    await request(app)
      .post('/api/proof-review')
      .set('Authorization', 'Bearer valid-token')
      .send({
        taskId: 'task-xyz',
        taskTitle: 'Fix login bug',
        proofType: 'github_link',
        proofContent: 'https://github.com/org/repo/commit/abc123 — fixed null check on auth token',
      });

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ proofStatus: expect.any(String), proofScore: expect.any(Number) }),
      { merge: true }
    );
  });

  test('reflection feedback resolves mobile daily log document id fallback', async () => {
    get
      .mockResolvedValueOnce({ exists: false, data: jest.fn() })
      .mockResolvedValueOnce({
        exists: true,
        data: jest.fn(() => ({
          honestAssessment: 'I finished the focus block but missed my reflection window.',
          wins: ['Finished focus block'],
          struggles: ['Delayed reflection'],
        })),
      });

    const app = (await import('../app')).app;
    const res = await request(app)
      .post('/api/reflection-feedback')
      .set('Authorization', 'Bearer valid-token')
      .send({ date: '2026-06-20' });

    expect(res.status).toBe(200);
    expect(res.body.feedback).toContain('Reflection captured');
    expect(dbDoc).toHaveBeenCalledWith('users/user-1/dailyLogs/2026-06-20');
    expect(dbDoc).toHaveBeenCalledWith('users/user-1/dailyLogs/user-1_2026-06-20');
    expect(set).toHaveBeenCalledWith(expect.objectContaining({
      mentorFeedback: expect.any(String),
    }), { merge: true });
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
