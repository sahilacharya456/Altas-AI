describe('Stripe service config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('does not treat mk-prefixed keys as Checkout-capable secret keys', async () => {
    process.env.STRIPE_SECRET_KEY = 'mk_1SbFDpEFGv4XgzBgYltuVgwO';
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID = 'price_123';

    const { getStripeConfigStatus, STRIPE_AVAILABLE } = await import('../services/stripe');
    const status = getStripeConfigStatus();

    expect(STRIPE_AVAILABLE).toBe(false);
    expect(status.available).toBe(false);
    expect(status.hasCheckoutKey).toBe(false);
    expect(status.message).toContain('sk_test_');
  });

  test('marks Checkout available with a secret key and Pro price ID', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID = 'price_123';

    const { getStripeConfigStatus } = await import('../services/stripe');
    const status = getStripeConfigStatus();

    expect(status.available).toBe(true);
    expect(status.hasCheckoutKey).toBe(true);
    expect(status.hasProPrice).toBe(true);
  });
});
