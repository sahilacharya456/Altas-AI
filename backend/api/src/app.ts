import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './lib/http';
import { aiRouter } from './routes/ai.routes';
import { proofFeedRouter } from './routes/proofFeed.routes';
import { recommendationsRouter } from './routes/recommendations.routes';
import { requestId } from './middleware/requestId';
import { requestLogger } from './middleware/requestLogger';
import { traceContext } from './middleware/traceContext';
import { requireAdminAccess } from './middleware/adminAccess';
import { requireAppCheck } from './middleware/appCheck';
import { mlServiceClient } from './altasai/clients/mlServiceClient';
import { getMetricsSnapshot, getBusinessMetrics, renderAdminStatsHtml, renderPrometheusMetrics } from './services/metrics';
import { getStripeConfigStatus, handleStripeWebhook, STRIPE_AVAILABLE } from './services/stripe';
import { grantProAccess, invalidateSubscriptionCache } from './services/subscription';
import { logger } from './utils/logger';

export const app = express();

const isAllowedCorsOrigin = (origin?: string): boolean => {
  if (!origin) return true;
  if (env.allowedOrigins.includes(origin)) return true;

  if (env.nodeEnv !== 'production') {
    try {
      const url = new URL(origin);
      return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    } catch {
      return false;
    }
  }

  return false;
};

// Rate limiters
const healthRateLimit = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'rate_limited', message: 'Too many health check requests. Try again in a minute.' } },
});

const adminRateLimit = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'rate_limited', message: 'Too many admin requests. Try again in a minute.' } },
});

app.set('trust proxy', 1);
app.use(requestId);
app.use(traceContext);
app.use(requestLogger);
app.use(helmet());

// Stripe webhook needs raw body — mount BEFORE express.json()
app.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
  
  if (!sig || typeof sig !== 'string') {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  // Validate idempotency key for replay protection
  if (!idempotencyKey || idempotencyKey.length < 16) {
    logger.warn('stripe.webhook_missing_idempotency_key', { 
      requestId: req.requestId,
      hasKey: !!idempotencyKey 
    });
    res.status(400).json({ error: 'Missing or invalid idempotency-key header' });
    return;
  }

  const result = await handleStripeWebhook(
    req.body as Buffer,
    sig,
    async (userId, tier, _customerId) => {
      await grantProAccess(userId, tier === 'team' ? 365 : 31);
      invalidateSubscriptionCache(userId);
    },
    async (userId) => {
      // On cancellation: subscription document will expire naturally via expiresAt
      // Just invalidate the cache so the next request re-reads from Firestore
      invalidateSubscriptionCache(userId);
    },
  );

  if (!result.received) {
    res.status(400).json({ error: result.error });
    return;
  }
  logger.info('stripe.webhook_processed', { 
    requestId: req.requestId, 
    idempotencyKey,
    eventType: result.eventType 
  });
  res.json({ received: true });
});

app.use(express.json({ limit: '256kb' }));
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedCorsOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: false,
}));

app.use('/api', rateLimit({
  windowMs: 60_000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Tighter rate limit on proof-review — prevents bulk fake-proof spam
app.use('/api/proof-review', rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'rate_limited', message: 'Too many proof submissions. Wait a minute and try again.' } },
}));

// Public proof feed read — no auth required, must be before requireAppCheck
app.use('/api/proof-feed', proofFeedRouter);

app.use('/api', requireAppCheck);

// Health check endpoints with rate limiting
app.get('/health', healthRateLimit, async (_req, res) => {
  const ml = await mlServiceClient.health();
  res.json({
    ok: true,
    service: 'altasai-backend',
    firebasePlan: 'spark-compatible',
    aiProviderConfigured: Boolean(process.env.GEMINI_API_KEY),
    paymentsConfigured: STRIPE_AVAILABLE,
    payments: getStripeConfigStatus(),
    internalIntelligence: true,
    architecture: 'express-api-firebase-auth-firestore',
    uptimeSeconds: Math.round(process.uptime()),
    memory: process.memoryUsage(),
    mlService: {
      ok: ml.ok,
      status: ml.status,
      fallbackReason: ml.fallbackReason,
    },
  });
});

app.get('/health/ml', healthRateLimit, async (_req, res) => {
  const ml = await mlServiceClient.health();
  res.status(ml.ok ? 200 : 503).json({
    ok: ml.ok,
    service: 'altasai-ml-service',
    status: ml.status,
    fallbackReason: ml.fallbackReason,
  });
});

// Admin endpoints with rate limiting and audit logging
app.get('/metrics', adminRateLimit, requireAdminAccess, (_req, res) => {
  logger.info('admin.metrics_accessed', { requestId: _req.requestId });
  res.type('text/plain').send(renderPrometheusMetrics());
});

app.get('/admin/stats', adminRateLimit, requireAdminAccess, (_req, res) => {
  logger.info('admin.stats_html_accessed', { requestId: _req.requestId });
  res.type('html').send(renderAdminStatsHtml());
});

app.get('/admin/stats.json', adminRateLimit, requireAdminAccess, (_req, res) => {
  logger.info('admin.stats_json_accessed', { requestId: _req.requestId });
  res.json(getMetricsSnapshot());
});

app.get('/admin/business-metrics.json', adminRateLimit, requireAdminAccess, (_req, res) => {
  logger.info('admin.business_metrics_accessed', { requestId: _req.requestId });
  res.json({ service: 'altasai-backend', events: getBusinessMetrics() });
});

app.use('/api', aiRouter);
app.use(errorHandler);
