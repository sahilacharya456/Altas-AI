import request from 'supertest';

const verifyIdToken = jest.fn();
const add = jest.fn();
const set = jest.fn();
const get = jest.fn();
const limit = jest.fn();
const docFn = jest.fn(() => ({ set }));
const collectionFn = jest.fn(() => ({ add, doc: docFn, limit }));

jest.mock('../lib/firebaseAdmin', () => ({
  auth: { verifyIdToken },
  db: {
    collection: collectionFn,
    doc: docFn,
    runTransaction: jest.fn(),
  },
  FieldValue: {
    serverTimestamp: () => new Date('2026-01-01T00:00:00.000Z'),
    increment: (value: number) => value,
  },
}));

jest.mock('../services/memory', () => ({
  retrieveSafeMemory: jest.fn(async () => ({
    profile: null, tasks: [], goals: [], reflections: [],
    focusSessions: [], expenses: [], healthLogs: [],
    digitalUsage: [], securityEvents: [], cortexRisk: null, behaviorEvents: [],
  })),
}));

jest.mock('../services/quota', () => ({
  enforceUserQuota: jest.fn(async () => ({ count: 1, limit: 60 })),
}));

jest.mock('../services/gemini', () => ({
  generateGeminiText: jest.fn(async () => ({ provider: 'offline', text: '', offline: true })),
  parseJsonWithSchema: jest.fn((_raw: string, _schema: unknown, fallback: unknown) => fallback),
}));

jest.mock('../altasai/clients/mlServiceClient', () => ({
  mlServiceClient: {
    health: jest.fn(async () => ({ ok: true, status: 200 })),
    recordReward: jest.fn(async () => ({ ok: true, status: 200, data: { rewardState: { count: 1 } } })),
  },
}));

describe('Recommendations routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    verifyIdToken.mockResolvedValue({ uid: 'user-1', email: 'user@example.com' });
    add.mockResolvedValue({ id: 'feedback-1' });
    set.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/recommendations/feedback', () => {
    test('rejects invalid body with missing recommendationId', async () => {
      const app = (await import('../app')).app;
      const res = await request(app)
        .post('/api/recommendations/feedback')
        .set('Authorization', 'Bearer valid-token')
        .send({ action: 'completed' });

      expect(res.status).toBe(400);
    });

    test('rejects invalid action enum', async () => {
      const app = (await import('../app')).app;
      const res = await request(app)
        .post('/api/recommendations/feedback')
        .set('Authorization', 'Bearer valid-token')
        .send({ recommendationId: 'rec-1', action: 'invalid_action' });

      expect(res.status).toBe(400);
    });

    test('calculates reward=1 for completed action', async () => {
      const app = (await import('../app')).app;
      const res = await request(app)
        .post('/api/recommendations/feedback')
        .set('Authorization', 'Bearer valid-token')
        .send({ recommendationId: 'rec-1', action: 'completed' });

      expect(res.status).toBe(201);
      expect(res.body.reward).toBe(1);
    });

    test('calculates reward=0.6 for accepted action', async () => {
      const app = (await import('../app')).app;
      const res = await request(app)
        .post('/api/recommendations/feedback')
        .set('Authorization', 'Bearer valid-token')
        .send({ recommendationId: 'rec-1', action: 'accepted' });

      expect(res.status).toBe(201);
      expect(res.body.reward).toBe(0.6);
    });

    test('calculates reward=-0.25 for dismissed action', async () => {
      const app = (await import('../app')).app;
      const res = await request(app)
        .post('/api/recommendations/feedback')
        .set('Authorization', 'Bearer valid-token')
        .send({ recommendationId: 'rec-1', action: 'dismissed' });

      expect(res.status).toBe(201);
      expect(res.body.reward).toBe(-0.25);
    });

    test('uses rating-based reward when rating is provided', async () => {
      const app = (await import('../app')).app;
      const res = await request(app)
        .post('/api/recommendations/feedback')
        .set('Authorization', 'Bearer valid-token')
        .send({ recommendationId: 'rec-1', action: 'helpful', rating: 5 });

      expect(res.status).toBe(201);
      expect(res.body.reward).toBe(1);
    });

    test('assigns deterministic A/B variant from userId and recommendationId', async () => {
      const app = (await import('../app')).app;
      const res1 = await request(app)
        .post('/api/recommendations/feedback')
        .set('Authorization', 'Bearer valid-token')
        .send({ recommendationId: 'rec-1', action: 'shown' });

      const res2 = await request(app)
        .post('/api/recommendations/feedback')
        .set('Authorization', 'Bearer valid-token')
        .send({ recommendationId: 'rec-1', action: 'shown' });

      expect(res1.body.variant).toBe(res2.body.variant);
      expect(['A', 'B']).toContain(res1.body.variant);
    });

    test('stores feedback to Firestore under user path', async () => {
      const app = (await import('../app')).app;
      await request(app)
        .post('/api/recommendations/feedback')
        .set('Authorization', 'Bearer valid-token')
        .send({ recommendationId: 'rec-x', action: 'helpful', source: 'cortex' });

      expect(collectionFn).toHaveBeenCalledWith('users/user-1/recommendationFeedback');
      expect(add).toHaveBeenCalledWith(expect.objectContaining({
        recommendationId: 'rec-x',
        source: 'cortex',
        action: 'helpful',
        reward: 1,
      }));
    });

    test('syncs reward to ML service', async () => {
      const { mlServiceClient } = require('../altasai/clients/mlServiceClient');
      const app = (await import('../app')).app;
      await request(app)
        .post('/api/recommendations/feedback')
        .set('Authorization', 'Bearer valid-token')
        .send({ recommendationId: 'rec-1', action: 'completed' });

      expect(mlServiceClient.recordReward).toHaveBeenCalledWith('user-1', 'rec-1', 1);
    });
  });

  describe('GET /api/recommendations/stats/:userId', () => {
    test('forbids access to another users stats', async () => {
      const app = (await import('../app')).app;
      const res = await request(app)
        .get('/api/recommendations/stats/other-user')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('forbidden');
    });

    test('returns aggregated stats for authenticated user', async () => {
      limit.mockReturnValue({
        get: jest.fn(async () => ({
          docs: [
            { id: 'rec-1', data: () => ({ feedbackCount: 5, completedCount: 3, acceptedCount: 1, rewardTotal: 3.5 }) },
            { id: 'rec-2', data: () => ({ feedbackCount: 2, completedCount: 0, acceptedCount: 2, rewardTotal: 1.2 }) },
          ],
        })),
      });

      const app = (await import('../app')).app;
      const res = await request(app)
        .get('/api/recommendations/stats/user-1')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.totals.feedbackCount).toBe(7);
      expect(res.body.totals.completedCount).toBe(3);
      expect(res.body.totals.averageReward).toBeCloseTo(4.7 / 7, 2);
      expect(res.body.stats).toHaveLength(2);
    });
  });

  describe('GET /api/recommendations/export/:userId', () => {
    test('forbids access to another users export', async () => {
      const app = (await import('../app')).app;
      const res = await request(app)
        .get('/api/recommendations/export/other-user')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(403);
    });

    test('returns formatted feedback rows', async () => {
      limit.mockReturnValue({
        get: jest.fn(async () => ({
          docs: [
            {
              id: 'fb-1',
              data: () => ({
                recommendationId: 'rec-1', source: 'mentor', action: 'completed',
                variant: 'A', outcome: 'success', rating: 5, reward: 1, context: {},
              }),
            },
          ],
        })),
      });

      const app = (await import('../app')).app;
      const res = await request(app)
        .get('/api/recommendations/export/user-1')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.format).toBe('altasai_recommendation_feedback_v1');
      expect(res.body.count).toBe(1);
      expect(res.body.rows[0].recommendationId).toBe('rec-1');
    });
  });
});
