import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { appCheck } from '../lib/firebaseAdmin';
import { ApiError } from '../lib/http';

export const requireAppCheck = async (req: Request, _res: Response, next: NextFunction) => {
  if (!env.requireAppCheck) {
    next();
    return;
  }

  const token = req.header('X-Firebase-AppCheck');
  if (!token) {
    next(new ApiError(401, 'Missing Firebase App Check token.', 'app_check_required'));
    return;
  }

  try {
    await appCheck.verifyToken(token);
    next();
  } catch {
    next(new ApiError(401, 'Invalid Firebase App Check token.', 'app_check_invalid'));
  }
};
