describe('security middleware', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('requires admin token when monitoring token is configured', () => {
    jest.doMock('../config/env', () => ({
      env: { adminMetricsToken: 'secret-token-12345' },
      isProduction: true,
    }));

    const { requireAdminAccess } = require('../middleware/adminAccess');
    const next = jest.fn();
    requireAdminAccess({ headers: {} } as any, {} as any, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'admin_unauthorized' }));
  });

  test('allows admin access with configured token', () => {
    jest.doMock('../config/env', () => ({
      env: { adminMetricsToken: 'secret-token-12345' },
      isProduction: true,
    }));

    const { requireAdminAccess } = require('../middleware/adminAccess');
    const next = jest.fn();
    requireAdminAccess({
      headers: { authorization: 'Bearer secret-token-12345' },
    } as any, {} as any, next);

    expect(next).toHaveBeenCalledWith();
  });

  test('requires Firebase App Check token when enforcement is enabled', async () => {
    jest.doMock('../config/env', () => ({
      env: { requireAppCheck: true },
    }));
    jest.doMock('../lib/firebaseAdmin', () => ({
      appCheck: { verifyToken: jest.fn() },
    }));

    const { requireAppCheck } = require('../middleware/appCheck');
    const next = jest.fn();
    await requireAppCheck({ header: jest.fn(() => undefined) } as any, {} as any, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: 'app_check_required' }));
  });

  test('verifies Firebase App Check token when enforcement is enabled', async () => {
    const verifyToken = jest.fn(async () => ({ appId: 'app-1' }));
    jest.doMock('../config/env', () => ({
      env: { requireAppCheck: true },
    }));
    jest.doMock('../lib/firebaseAdmin', () => ({
      appCheck: { verifyToken },
    }));

    const { requireAppCheck } = require('../middleware/appCheck');
    const next = jest.fn();
    await requireAppCheck({ header: jest.fn(() => 'valid-app-check') } as any, {} as any, next);

    expect(verifyToken).toHaveBeenCalledWith('valid-app-check');
    expect(next).toHaveBeenCalledWith();
  });
});
