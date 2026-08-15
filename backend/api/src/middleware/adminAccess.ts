import type { Request, Response, NextFunction } from 'express';
import { createHash, timingSafeEqual } from 'crypto';
import { env, isProduction } from '../config/env';
import { ApiError } from '../lib/http';
import { logger } from '../utils/logger';

const readToken = (req: Request) => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length);
  const direct = req.headers['x-altasai-admin-token'];
  return Array.isArray(direct) ? direct[0] : direct;
};

const hashToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

const verifyToken = (provided: string, storedHash: string): boolean => {
  try {
    const providedHash = hashToken(provided);
    return timingSafeEqual(Buffer.from(providedHash), Buffer.from(storedHash));
  } catch {
    return false;
  }
};

let _devWarned = false;

// Parse comma-separated token hashes for rotation support (current, previous)
const getValidTokenHashes = (): string[] => {
  if (!env.adminMetricsToken) return [];
  
  // Support both legacy plain token and new hash format
  // Format: "hash1,hash2" or just "plain_token"
  if (env.adminMetricsToken.includes(',')) {
    return env.adminMetricsToken.split(',').map(h => h.trim()).filter(Boolean);
  }
  
  // If it's a plain token (legacy), hash it for comparison
  const plainToken = env.adminMetricsToken;
  if (plainToken.length >= 32 && /^[a-f0-9]+$/i.test(plainToken)) {
    // Already looks like a hash
    return [plainToken];
  }
  
  // Legacy plain token - hash it
  return [hashToken(plainToken)];
};

export const requireAdminAccess = (req: Request, _res: Response, next: NextFunction) => {
  const validHashes = getValidTokenHashes();
  
  if (validHashes.length === 0 && !isProduction) {
    if (!_devWarned) {
      logger.warn('admin_access.unprotected', { message: 'Admin endpoints are open — set ADMIN_METRICS_TOKEN before deploying.' });
      _devWarned = true;
    }
    next();
    return;
  }

  if (validHashes.length === 0) {
    next(new ApiError(503, 'Admin monitoring token is not configured.', 'admin_token_missing'));
    return;
  }

  const providedToken = readToken(req);
  if (!providedToken) {
    next(new ApiError(401, 'Admin monitoring token required.', 'admin_unauthorized'));
    return;
  }

  const isValid = validHashes.some(hash => verifyToken(providedToken, hash));
  
  if (!isValid) {
    logger.warn('admin_access.unauthorized', { 
      requestId: req.requestId,
      ip: req.ip 
    });
    next(new ApiError(401, 'Admin monitoring token required.', 'admin_unauthorized'));
    return;
  }

  logger.info('admin_access.granted', { requestId: req.requestId });
  next();
};
