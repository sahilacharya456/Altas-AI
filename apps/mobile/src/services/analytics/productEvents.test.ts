import {
  clearBufferedProductEvents,
  getBufferedProductEvents,
  trackProductEvent,
} from './productEvents';

describe('productEvents', () => {
  beforeEach(() => {
    clearBufferedProductEvents();
  });

  test('buffers typed product events for startup metrics', () => {
    const event = trackProductEvent('mentor_prompt_submitted', {
      userId: 'user-1',
      metadata: { promptLength: 32 },
    });

    expect(event.name).toBe('mentor_prompt_submitted');
    expect(getBufferedProductEvents()).toHaveLength(1);
    expect(getBufferedProductEvents()[0].payload.metadata?.promptLength).toBe(32);
  });
});
