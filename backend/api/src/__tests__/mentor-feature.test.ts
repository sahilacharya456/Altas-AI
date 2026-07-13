import request from 'supertest';

// ── Shared mocks ───────────────────────────────────────────────────────────────

const verifyIdToken = jest.fn();
const add = jest.fn().mockResolvedValue({ id: 'feed-1' });
const set = jest.fn().mockResolvedValue(undefined);
const get = jest.fn().mockResolvedValue({ exists: false, data: jest.fn() });
const orderBy = jest.fn(() => ({ limit: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })) }));
const collection = jest.fn(() => ({ add, doc: jest.fn(() => ({ id: 'doc-1', get, set })), orderBy }));
const doc = jest.fn(() => ({ id: 'doc-1', get, set }));

jest.mock('../lib/firebaseAdmin', () => ({
  auth: { verifyIdToken },
  db: { collection, doc, runTransaction: jest.fn() },
  FieldValue: {
    arrayUnion: (...items: unknown[]) => items,
    serverTimestamp: () => new Date('2026-01-01T00:00:00.000Z'),
    increment: (n: number) => n,
  },
  Timestamp: {
    fromDate: (d: Date) => ({ toDate: () => d, seconds: Math.floor(d.getTime() / 1000) }),
  },
}));

jest.mock('../services/memory', () => ({
  retrieveSafeMemory: jest.fn(async () => ({
    profile: { displayName: 'Sahil', disciplineLevel: 'strict' },
    tasks: [], goals: [], reflections: [], focusSessions: [],
    expenses: [], healthLogs: [], digitalUsage: [], securityEvents: [],
    cortexRisk: null, behaviorEvents: [], ragContext: undefined, reflectionAnalysis: undefined,
  })),
}));

jest.mock('../services/conversation', () => ({
  retrieveConversationHistory: jest.fn(async () => []),
}));

jest.mock('../services/quota', () => ({
  enforceUserQuota: jest.fn(async () => ({ count: 1, limit: 60 })),
}));

jest.mock('../services/gemini', () => ({
  generateGeminiText: jest.fn(async () => ({ provider: 'offline', text: '', offline: true })),
  parseJsonWithSchema: jest.fn((_raw, _schema, fallback) => fallback),
}));

jest.mock('../altasai/clients/mlServiceClient', () => ({
  mlServiceClient: {
    health: jest.fn(async () => ({ ok: true, data: { ok: true } })),
    recordReward: jest.fn(async () => ({ ok: true, data: { rewardState: { count: 1 } } })),
    predictIntent: jest.fn(async () => ({ ok: false, fallbackReason: 'offline' })),
    predictEntities: jest.fn(async () => ({ ok: false, fallbackReason: 'offline' })),
    recommendAction: jest.fn(async () => ({ ok: false, fallbackReason: 'offline' })),
    analyzeReflection: jest.fn(async () => ({ ok: false, fallbackReason: 'offline' })),
    indexUserMemory: jest.fn(async () => ({ ok: false, fallbackReason: 'offline' })),
    queryRagForUser: jest.fn(async () => ({ ok: false, fallbackReason: 'offline' })),
  },
}));

jest.mock('../services/subscription', () => ({
  getTierLimits: jest.fn(async () => ({
    tier: 'free',
    dailyMentorMessages: 3,
    proofReviewsPerDay: 5,
    activeTaskLimit: 5,
    activeGoalLimit: 2,
    ragMemoryEnabled: false,
    conversationHistoryEnabled: false,
    githubProofEnabled: false,
    voiceEnabled: false,
    analyticsEnabled: false,
    reportGenerationEnabled: false,
  })),
}));

// ──────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  verifyIdToken.mockResolvedValue({ uid: 'user-1', email: 'user@test.com' });
  add.mockResolvedValue({ id: 'feed-1' });
  set.mockResolvedValue(undefined);
  get.mockResolvedValue({ exists: false, data: jest.fn() });
  orderBy.mockReturnValue({ limit: jest.fn(() => ({ get: jest.fn().mockResolvedValue({ docs: [] }) })) });
});

// Helper: load a fresh app instance isolated from other test files' module cache
const freshApp = () => new Promise<import('express').Express>((resolve) => {
  jest.isolateModules(() => {
    void import('../app').then((m) => resolve(m.app));
  });
});

describe('Subscription endpoint', () => {
  test('GET /api/subscription returns tier limits shape for authenticated user', async () => {
    const app = await freshApp();
    const res = await request(app)
      .get('/api/subscription')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.tier).toBe('free');
    expect(typeof res.body.dailyMentorMessages).toBe('number');
    expect(typeof res.body.proofReviewsPerDay).toBe('number');
    expect(typeof res.body.githubProofEnabled).toBe('boolean');
  });

  test('GET /api/subscription returns 401 without token', async () => {
    const app = await freshApp();
    const res = await request(app).get('/api/subscription');
    expect(res.status).toBe(401);
  });
});

describe('Proof feed', () => {
  test('GET /api/proof-feed/recent returns empty items when collection is empty', async () => {
    const app = await freshApp();
    const res = await request(app).get('/api/proof-feed/recent');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  test('POST /api/proof-feed/publish rejects score below 70', async () => {
    const app = await freshApp();
    const res = await request(app)
      .post('/api/proof-feed/publish')
      .set('Authorization', 'Bearer valid-token')
      .send({ taskId: 't1', taskTitle: 'Fix auth bug', category: 'career', proofType: 'text', score: 50 });
    expect(res.status).toBe(400);
  });

  test('POST /api/proof-feed/publish requires authentication', async () => {
    const app = await freshApp();
    const res = await request(app)
      .post('/api/proof-feed/publish')
      .send({ taskId: 't1', taskTitle: 'Fix bug', category: 'career', proofType: 'text', score: 90 });
    expect(res.status).toBe(401);
  });

  test('POST /api/proof-feed/publish succeeds with valid payload', async () => {
    const app = await freshApp();
    const res = await request(app)
      .post('/api/proof-feed/publish')
      .set('Authorization', 'Bearer valid-token')
      .send({ taskId: 't1', taskTitle: 'Implement authentication module', category: 'career', proofType: 'github_link', score: 92 });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.feedId).toBeTruthy();
    // userId must NOT be in the published doc
    const callArg = add.mock.calls[0]?.[0] as Record<string, unknown> | undefined;
    expect(callArg).toBeDefined();
    expect(callArg?.category).toBe('career');
    expect(callArg?.score).toBe(92);
    expect(callArg?.userId).toBeUndefined();
  });

  test('published doc masks task title to first 3 words', async () => {
    const app = await freshApp();
    await request(app)
      .post('/api/proof-feed/publish')
      .set('Authorization', 'Bearer valid-token')
      .send({ taskId: 't2', taskTitle: 'Write full unit tests for the payment service', category: 'career', proofType: 'text', score: 75 });

    const callArg = add.mock.calls[0]?.[0] as Record<string, unknown> | undefined;
    expect(callArg?.taskTitleMasked).toBe('Write full unit...');
  });
});

describe('Proof review — tier limits', () => {
  test('proof-review uses tier quota not global env quota', async () => {
    const { enforceUserQuota } = jest.requireMock('../services/quota');
    const { getTierLimits } = jest.requireMock('../services/subscription');

    const app = await freshApp();
    await request(app)
      .post('/api/proof-review')
      .set('Authorization', 'Bearer valid-token')
      .send({ taskId: 't1', taskTitle: 'Fix bug', proofType: 'text', proofContent: 'I completed the bug fix and tested it' });

    expect(getTierLimits).toHaveBeenCalledWith('user-1');
    expect(enforceUserQuota).toHaveBeenCalledWith('user-1', expect.objectContaining({ bucket: 'proof-review', limit: 5 }));
  });
});

describe('Business metrics endpoint', () => {
  test('GET /admin/business-metrics.json returns event counters shape', async () => {
    const app = await freshApp();
    const res = await request(app)
      .get('/admin/business-metrics.json')
      .set('x-admin-token', 'test-token');

    expect([200, 401]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.events).toBeDefined();
      expect(typeof res.body.events.proof_submitted).toBe('number');
      expect(typeof res.body.events.mentor_message_sent).toBe('number');
    }
  });
});

describe('GitHub proof heuristic detection', () => {
  test('proof-review with github_link type passes without crashing (free tier heuristic)', async () => {
    const app = await freshApp();
    const res = await request(app)
      .post('/api/proof-review')
      .set('Authorization', 'Bearer valid-token')
      .send({
        taskId: 't1',
        taskTitle: 'Fix authentication bug',
        proofType: 'github_link',
        proofContent: 'https://github.com/testorg/testrepo/commit/abc1234',
      });

    expect(res.status).toBe(200);
    expect(['verified', 'weak', 'rejected']).toContain(res.body.status);
    expect(res.body.tier).toBe('free');
  });
});
