import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './lib/http';
import { aiRouter } from './routes/ai.routes';
import { requestId } from './middleware/requestId';
import { requestLogger } from './middleware/requestLogger';
import { requireAdminAccess } from './middleware/adminAccess';
import { requireAppCheck } from './middleware/appCheck';
import { mlServiceClient } from './altasai/clients/mlServiceClient';
import { getMetricsSnapshot, renderAdminStatsHtml, renderPrometheusMetrics } from './services/metrics';

export const app = express();

app.set('trust proxy', 1);
app.use(requestId);
app.use(requestLogger);
app.use(helmet());
app.use(express.json({ limit: '256kb' }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.allowedOrigins.includes(origin)) {
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
app.use('/api', requireAppCheck);

app.get('/health', async (_req, res) => {
  const ml = await mlServiceClient.health();
  res.json({
    ok: true,
    service: 'altasai-backend',
    firebasePlan: 'spark-compatible',
    aiProviderConfigured: Boolean(process.env.GEMINI_API_KEY),
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

app.get('/health/ml', async (_req, res) => {
  const ml = await mlServiceClient.health();
  res.status(ml.ok ? 200 : 503).json({
    ok: ml.ok,
    service: 'altasai-ml-service',
    status: ml.status,
    fallbackReason: ml.fallbackReason,
  });
});

app.get('/metrics', requireAdminAccess, (_req, res) => {
  res.type('text/plain').send(renderPrometheusMetrics());
});

app.get('/admin/stats', requireAdminAccess, (_req, res) => {
  res.type('html').send(renderAdminStatsHtml());
});

app.get('/admin/stats.json', requireAdminAccess, (_req, res) => {
  res.json(getMetricsSnapshot());
});

app.use('/api', aiRouter);
app.use(errorHandler);
