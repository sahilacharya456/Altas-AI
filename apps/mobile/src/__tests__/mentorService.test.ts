const callBackend = jest.fn();

jest.mock('../services/ai/backendClient', () => {
  class BackendApiError extends Error {
    constructor(message: string, public readonly status?: number) {
      super(message);
    }
  }

  return {
    BackendApiError,
    callBackend,
  };
});

describe('mentor AI service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('propagates quota errors instead of returning offline fallback', async () => {
    const { BackendApiError } = await import('../services/ai/backendClient');
    const { chatWithMentor } = await import('../services/ai/mentor');

    callBackend.mockRejectedValueOnce(new BackendApiError('Daily quota reached.', 429));

    await expect(chatWithMentor('plan my next move')).rejects.toMatchObject({
      status: 429,
      message: 'Daily quota reached.',
    });
  });

  test('uses offline fallback for network failures', async () => {
    const { chatWithMentor } = await import('../services/ai/mentor');
    callBackend.mockRejectedValueOnce(new Error('network down'));

    const result = await chatWithMentor('plan my next move');

    expect(result.offline).toBe(true);
    expect(result.response).toContain('AltasAI Mentor is temporarily offline.');
  });

  test('uses offline reflection feedback when backend is unavailable', async () => {
    const { generateReflectionFeedback } = await import('../services/ai/mentor');
    callBackend.mockRejectedValueOnce(new Error('network down'));

    const feedback = await generateReflectionFeedback('2026-06-20');

    expect(feedback).toContain('Reflection saved.');
    expect(feedback).toContain('AltasAI feedback is offline');
  });
});
