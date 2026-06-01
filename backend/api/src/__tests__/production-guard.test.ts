/**
 * Tests that the production startup guard fires correctly.
 * In production, missing FIREBASE_SERVICE_ACCOUNT_JSON must be a hard failure.
 * Missing App Check / Admin token are warnings (not fatal), since they may be
 * acceptable for early beta but must be visible in logs.
 */

describe('production startup guard', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('throws if FIREBASE_SERVICE_ACCOUNT_JSON is missing in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    // Ensure other required vars are present to isolate this check
    process.env.ALLOWED_ORIGINS = 'https://app.altasai.com';

    expect(() => {
      jest.isolateModules(() => {
        require('../config/env');
      });
    }).toThrow('FIREBASE_SERVICE_ACCOUNT_JSON is required in production');
  });

  test('does not throw in development without service account', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    expect(() => {
      jest.isolateModules(() => {
        require('../config/env');
      });
    }).not.toThrow();
  });

  test('does not throw in test environment', () => {
    process.env.NODE_ENV = 'test';

    expect(() => {
      jest.isolateModules(() => {
        require('../config/env');
      });
    }).not.toThrow();
  });
});
