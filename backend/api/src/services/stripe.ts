/**
 * Stripe payment integration for AltasAI Pro subscriptions.
 *
 * Install: npm install stripe --workspace=@altasai/backend
 *
 * Routes wired in app.ts:
 *   POST /api/subscription/create-checkout   → create Stripe Checkout session
 *   POST /api/subscription/portal            → customer billing portal
 *   POST /stripe/webhook                     → Stripe webhook handler (raw body)
 */

import { logger } from '../utils/logger';

// Use unknown to avoid requiring the stripe package at typecheck time.
// The actual Stripe SDK is loaded lazily at runtime only when the key is present.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StripeInstance = any;

let _stripe: StripeInstance | null = null;

const getStripeSecretKey = (): string | undefined => process.env.STRIPE_SECRET_KEY?.trim();

const isCheckoutCapableStripeKey = (key?: string): boolean =>
  Boolean(key && /^(sk|rk)_(test|live)_/.test(key));

export const getStripeConfigStatus = () => {
  const key = getStripeSecretKey();
  const hasCheckoutKey = isCheckoutCapableStripeKey(key);
  const hasProPrice = Boolean(process.env.STRIPE_PRO_MONTHLY_PRICE_ID && !process.env.STRIPE_PRO_MONTHLY_PRICE_ID.startsWith('price_replace'));
  const hasTeamPrice = Boolean(process.env.STRIPE_TEAM_MONTHLY_PRICE_ID && !process.env.STRIPE_TEAM_MONTHLY_PRICE_ID.startsWith('price_replace'));
  const hasWebhookSecret = Boolean(process.env.STRIPE_WEBHOOK_SECRET && !process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_replace'));

  return {
    available: hasCheckoutKey && hasProPrice,
    hasCheckoutKey,
    hasProPrice,
    hasTeamPrice,
    hasWebhookSecret,
    message: hasCheckoutKey
      ? hasProPrice
        ? 'Stripe Checkout is configured.'
        : 'Set STRIPE_PRO_MONTHLY_PRICE_ID to a real Stripe Price ID.'
      : 'Set STRIPE_SECRET_KEY to a Stripe secret or restricted key that starts with sk_test_, sk_live_, rk_test_, or rk_live_.',
  };
};

const getStripe = (): StripeInstance | null => {
  if (_stripe) return _stripe;
  const key = getStripeSecretKey();
  if (!isCheckoutCapableStripeKey(key) || key?.startsWith('sk_test_replace')) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Stripe = require('stripe');
    const StripeClass = Stripe.default ?? Stripe;
    _stripe = new StripeClass(key, { apiVersion: '2024-06-20', typescript: true });
    return _stripe;
  } catch {
    logger.warn('stripe.not_installed', { hint: 'Run: npm install stripe --workspace=@altasai/backend' });
    return null;
  }
};

export const STRIPE_AVAILABLE = getStripeConfigStatus().available;

export const createCheckoutSession = async (
  userId: string,
  email: string,
  tier: 'pro' | 'team',
  successUrl: string,
  cancelUrl: string,
): Promise<{ url: string | null; error?: string }> => {
  const stripe = getStripe();
  if (!stripe) return { url: null, error: getStripeConfigStatus().message };

  const priceId = tier === 'team'
    ? process.env.STRIPE_TEAM_MONTHLY_PRICE_ID
    : process.env.STRIPE_PRO_MONTHLY_PRICE_ID;

  if (!priceId || priceId.startsWith('price_replace')) {
    return { url: null, error: 'Price not configured.' };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, tier },
      subscription_data: { metadata: { userId, tier } },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return { url: (session as { url: string | null }).url };
  } catch (error) {
    logger.warn('stripe.checkout_failed', { userId, error: error instanceof Error ? error.message : String(error) });
    return { url: null, error: 'Could not create payment session.' };
  }
};

export const createPortalSession = async (
  customerId: string,
  returnUrl: string,
): Promise<{ url: string | null; error?: string }> => {
  const stripe = getStripe();
  if (!stripe) return { url: null, error: getStripeConfigStatus().message };

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const session = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: returnUrl });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return { url: (session as { url: string }).url };
  } catch (error) {
    return { url: null, error: error instanceof Error ? error.message : 'Portal error.' };
  }
};

export const handleStripeWebhook = async (
  rawBody: Buffer,
  signature: string,
  onSubscriptionActivated: (userId: string, tier: 'pro' | 'team', customerId: string) => Promise<void>,
  onSubscriptionCancelled: (userId: string) => Promise<void>,
): Promise<{ received: boolean; error?: string }> => {
  const stripe = getStripe();
  if (!stripe) return { received: false, error: getStripeConfigStatus().message };

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || secret.startsWith('whsec_replace')) {
    return { received: false, error: 'Webhook secret not configured.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let event: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    return { received: false, error: `Webhook signature failed: ${err instanceof Error ? err.message : String(err)}` };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const sub = event.data.object;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const userId = sub.metadata?.userId as string | undefined;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const tier = (sub.metadata?.tier === 'team' ? 'team' : 'pro') as 'pro' | 'team';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const customerId = typeof sub.customer === 'string' ? sub.customer as string : (sub.customer as { id: string }).id;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (userId && sub.status === 'active') {
        await onSubscriptionActivated(userId, tier, customerId);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (event.type === 'customer.subscription.deleted') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const sub = event.data.object;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const userId = sub.metadata?.userId as string | undefined;
      if (userId) await onSubscriptionCancelled(userId);
    }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    logger.warn('stripe.webhook_handler_failed', { type: event.type, error: error instanceof Error ? error.message : String(error) });
  }

  return { received: true };
};
