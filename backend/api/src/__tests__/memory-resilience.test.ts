/**
 * Tests that retrieveSafeMemory degrades gracefully when individual Firestore
 * queries fail. Previously, profileDoc/tasksSnapshot/goalsSnapshot/logsSnapshot/
 * cortexDoc had no .catch() — any Firestore failure crashed all AI routes.
 *
 * After the fix, each collection fetch is independently fault-tolerant.
 */

const mockGet = jest.fn();
const mockCatch = jest.fn();

// Build a Firestore mock where specific queries can be made to throw
const makeQuery = (shouldFail: boolean, docs: unknown[] = []) => ({
  get: shouldFail
    ? jest.fn().mockRejectedValue(new Error('FAILED_PRECONDITION: Missing composite index'))
    : jest.fn().mockResolvedValue({ docs: docs.map(d => ({ data: () => d })), exists: false }),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
});

const makeDocQuery = (shouldFail: boolean, data?: unknown, exists = true) => ({
  get: shouldFail
    ? jest.fn().mockRejectedValue(new Error('PERMISSION_DENIED'))
    : jest.fn().mockResolvedValue({ exists, data: () => data }),
});

jest.mock('../lib/firebaseAdmin', () => {
  const docFn = jest.fn();
  const collectionFn = jest.fn();
  return {
    db: { doc: docFn, collection: collectionFn },
    Timestamp: {
      fromDate: jest.fn((d: Date) => d),
      now: jest.fn(() => new Date()),
    },
  };
});

jest.mock('../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('retrieveSafeMemory resilience', () => {
  const { db } = require('../lib/firebaseAdmin');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns empty arrays when ALL critical Firestore queries fail', async () => {
    // Mock every query to fail
    db.doc.mockReturnValue(makeDocQuery(true));
    db.collection.mockReturnValue(makeQuery(true));

    const { retrieveSafeMemory } = require('../services/memory');
    const result = await retrieveSafeMemory('user-123');

    // Must NOT throw — must return empty safe memory
    expect(result.profile).toBeNull();
    expect(result.tasks).toEqual([]);
    expect(result.goals).toEqual([]);
    expect(result.reflections).toEqual([]);
    expect(result.focusSessions).toEqual([]);
    expect(result.cortexRisk).toBeNull();
    expect(result.behaviorEvents).toEqual([]);
  });

  test('returns partial data when only secondary queries fail', async () => {
    const profileData = { displayName: 'Test', disciplineLevel: 'strict', currentScores: { discipline: 70 } };

    db.doc.mockImplementation((path: string) => {
      if (path.includes('profile')) return makeDocQuery(false, profileData);
      return makeDocQuery(true); // cortex fails
    });

    db.collection.mockImplementation((path: string) => {
      if (path.includes('tasks')) return makeQuery(false, [{ title: 'Test task', status: 'pending' }]);
      if (path.includes('goals')) return makeQuery(false, [{ title: 'Test goal', status: 'active' }]);
      return makeQuery(true); // everything else fails
    });

    const { retrieveSafeMemory } = require('../services/memory');
    const result = await retrieveSafeMemory('user-123');

    // Profile and tasks should come through despite other failures
    expect(result.profile?.displayName).toBe('Test');
    expect(result.tasks).toHaveLength(1);
    expect(result.goals).toHaveLength(1);
    expect(result.reflections).toEqual([]); // failed gracefully
    expect(result.cortexRisk).toBeNull(); // failed gracefully
  });

  test('logs a warning for each failed query', async () => {
    db.doc.mockReturnValue(makeDocQuery(true));
    db.collection.mockReturnValue(makeQuery(true));

    const { logger } = require('../utils/logger');
    const { retrieveSafeMemory } = require('../services/memory');
    await retrieveSafeMemory('user-456');

    // At least the named critical queries should have logged warnings
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringMatching(/memory\./),
      expect.objectContaining({ userId: 'user-456' })
    );
  });
});
