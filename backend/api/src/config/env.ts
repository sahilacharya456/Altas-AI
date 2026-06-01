import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const parseOrigins = (value?: string): string[] =>
  (value ?? 'http://localhost:8081,http://127.0.0.1:8081')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const parseBoolean = (value?: string): boolean =>
  ['1', 'true', 'yes', 'on'].includes((value ?? '').toLowerCase());

const envSchema = z.object({
  port: z.coerce.number().int().min(1).max(65535).default(3001),
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  allowedOrigins: z.array(z.string().min(1)).default(['http://localhost:8081', 'http://127.0.0.1:8081']),
  firebaseProjectId: z.string().min(1).default('altasai'),
  firebaseServiceAccountJson: z.string().optional(),
  geminiApiKey: z.string().optional(),
  geminiModel: z.string().min(1).default('gemini-2.5-flash'),
  aiDailyQuota: z.coerce.number().int().min(1).max(1000).default(60),
  mlServiceBaseUrl: z.string().url().default('http://127.0.0.1:8001'),
  mlServiceTimeoutMs: z.coerce.number().int().min(500).max(30000).default(3500),
  requireAppCheck: z.boolean().default(false),
  adminMetricsToken: z.string().min(16).optional(),
});

const parsed = envSchema.safeParse({
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  aiDailyQuota: process.env.AI_DAILY_QUOTA,
  mlServiceBaseUrl: process.env.ML_SERVICE_BASE_URL,
  mlServiceTimeoutMs: process.env.ML_SERVICE_TIMEOUT_MS,
  requireAppCheck: parseBoolean(process.env.REQUIRE_APP_CHECK),
  adminMetricsToken: process.env.ADMIN_METRICS_TOKEN,
});

if (!parsed.success) {
  throw new Error(`Invalid backend environment: ${JSON.stringify(parsed.error.format())}`);
}

export const env = parsed.data;

export const isProduction = env.nodeEnv === 'production';

// Production safety guards — fail fast rather than run insecure.
if (isProduction) {
  const warnings: string[] = [];

  if (!env.firebaseServiceAccountJson) {
    throw new Error('[AltasAI] FIREBASE_SERVICE_ACCOUNT_JSON is required in production.');
  }
  if (!env.requireAppCheck) {
    warnings.push('REQUIRE_APP_CHECK is false — Firebase App Check is not enforced. Set to true before accepting real users.');
  }
  if (!env.adminMetricsToken) {
    warnings.push('ADMIN_METRICS_TOKEN is not set — /metrics and /admin/stats endpoints are unprotected.');
  }
  if (env.allowedOrigins.some(o => o.includes('localhost') || o.includes('127.0.0.1'))) {
    warnings.push('ALLOWED_ORIGINS contains localhost entries — remove these for production.');
  }

  for (const warning of warnings) {
    // Use console.warn directly here since logger may not be loaded yet
    console.warn(`[AltasAI Production Warning] ${warning}`);
  }
}
