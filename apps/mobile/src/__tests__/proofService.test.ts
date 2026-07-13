const callBackend = jest.fn();

jest.mock('../services/ai/backendClient', () => ({
  callBackend,
}));

describe('proof AI service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns weak offline review when backend is unavailable', async () => {
    const { reviewProof } = await import('../services/ai/proof');
    callBackend.mockRejectedValueOnce(new Error('network down'));

    const result = await reviewProof('task-1', 'Write tests', 'text', 'Added focused tests for fallback behavior.');

    expect(result).toMatchObject({
      status: 'weak',
      offline: true,
      provider: 'internal',
    });
    expect(result.feedbackToUser).toContain('more specific summary');
  });
});
