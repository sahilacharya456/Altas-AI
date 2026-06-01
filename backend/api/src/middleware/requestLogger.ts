import type { Request, Response, NextFunction } from 'express';
import { observeHttpRequest } from '../services/metrics';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    logger.info('request.completed', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
    });
    observeHttpRequest(req, res, Date.now() - startedAt);
  });
  next();
};
