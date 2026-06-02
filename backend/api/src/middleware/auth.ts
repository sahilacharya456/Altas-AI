import type { Response, NextFunction } from 'express';
import { auth } from '../lib/firebaseAdmin';
import { env } from '../config/env';
import { ApiError, type AuthedRequest } from '../lib/http';
import { logger } from '../utils/logger';

const decodeTokenUnsafe = (token: string): { uid: string; email?: string } | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (payload.user_id || payload.uid || payload.sub) {
      return { uid: payload.user_id ?? payload.uid ?? payload.sub, email: payload.email };
    }
    return null;
  } catch {
    return null;
  }
};

export const requireAuth = async (
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

    if (!token) {
      throw new ApiError(401, 'Missing Firebase ID token.', 'unauthenticated');
    }

    try {
      const decoded = await auth.verifyIdToken(token);
      req.user = { uid: decoded.uid, email: decoded.email };
    } catch (verifyError) {
      if (env.nodeEnv === 'development' && !env.firebaseServiceAccountJson) {
        const decoded = decodeTokenUnsafe(token);
        if (decoded) {
          logger.warn('auth.dev_bypass', { uid: decoded.uid });
          req.user = decoded;
        } else {
          throw verifyError;
        }
      } else {
        throw verifyError;
      }
    }

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }
    next(new ApiError(401, 'Invalid or expired Firebase ID token.', 'unauthenticated'));
  }
};
