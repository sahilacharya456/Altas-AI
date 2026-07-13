/**
 * TraceContext — lightweight AsyncLocalStorage-based trace propagation.
 *
 * No external OpenTelemetry SDK needed. Provides:
 *  - Storage of traceId per request in AsyncLocalStorage
 *  - Express middleware to seed it from x-trace-id or x-request-id headers
 *  - Getter for use in logger and ML service client
 *
 * The traceId flows: Mobile → Express (x-trace-id header) → FastAPI ML service (x-trace-id header)
 * and back in all response/log lines so distributed traces can be correlated.
 */
import { AsyncLocalStorage } from 'async_hooks';
import type { Request, Response, NextFunction } from 'express';

interface TraceStore {
  traceId: string;
}

const traceStorage = new AsyncLocalStorage<TraceStore>();

/** Get the current request's trace ID from async context (returns undefined outside request scope). */
export const getTraceId = (): string | undefined => traceStorage.getStore()?.traceId;

/**
 * Express middleware: reads x-trace-id (preferred) or x-request-id from inbound headers,
 * seeds AsyncLocalStorage, and adds x-trace-id to response headers.
 *
 * Mount AFTER requestId middleware so req.requestId is already populated.
 */
export const traceContext = (req: Request, res: Response, next: NextFunction): void => {
  const incoming =
    (req.header('x-trace-id') ?? req.requestId ?? '').slice(0, 128) || (req.requestId ?? '');

  res.setHeader('x-trace-id', incoming);

  traceStorage.run({ traceId: incoming }, next);
};
