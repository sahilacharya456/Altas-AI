import type { Request, Response, NextFunction } from 'express';
import { env, isProduction } from '../config/env';
import { ApiError } from '../lib/http';
import { logger } from '../utils/logger';

const readToken = (req: Request) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);
  const direct = req.headers['x-altasai-admin-token'];
  return Array.isArray(direct) ? direct[0] : direct;
};

let _devWarned = false;

export const requireAdminAccess = (req: Request, _res: Response, next: NextFunction) => {
  if (!env.adminMetricsToken && !isProduction) {
    if (!_devWarned) {
      logger.warn('admin_access.unprotected', { message: 'Admin endpoints are open — set ADMIN_METRICS_TOKEN before deploying.' });
      _devWarned = true;
    }
    next();
    return;
  }

  if (!env.adminMetricsToken) {
    next(new ApiError(503, 'Admin monitoring token is not configured.', 'admin_token_missing'));
    return;
  }

  if (readToken(req) !== env.adminMetricsToken) {
    next(new ApiError(401, 'Admin monitoring token required.', 'admin_unauthorized'));
    return;
  }

  next();
};
