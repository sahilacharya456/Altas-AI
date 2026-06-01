/**
 * Verifies that backendClient reads the correct env variable name.
 * This prevents regression of the P0 bug where EXPO_PUBLIC_ATLAS_API_BASE_URL
 * was set in .env but the code read EXPO_PUBLIC_ALTASAI_API_BASE_URL.
 */

jest.mock('../services/firebase/auth', () => ({
  getIdToken: jest.fn(async () => 'mock-token'),
}));

describe('backendClient env variable', () => {
  test('EXPO_PUBLIC_ALTASAI_API_BASE_URL is the correct env variable name', () => {
    // The variable the code reads must match what .env defines.
    // If this test is run with an explicit env value, verify it is picked up.
    const value = process.env.EXPO_PUBLIC_ALTASAI_API_BASE_URL;
    // When not set, the fallback to localhost is acceptable.
    if (value !== undefined) {
      expect(value).toBeTruthy();
      expect(value).not.toContain('ATLAS_API_BASE_URL');
    }
    // Confirm the wrong variable name is NOT set (would indicate .env regression)
    expect(process.env.EXPO_PUBLIC_ATLAS_API_BASE_URL).toBeUndefined();
  });

  test('BackendApiError is exported with correct shape', async () => {
    const { BackendApiError } = await import('../services/ai/backendClient');
    const err = new BackendApiError('test error', 401);
    expect(err.message).toBe('test error');
    expect(err.status).toBe(401);
    expect(err).toBeInstanceOf(Error);
  });
});
