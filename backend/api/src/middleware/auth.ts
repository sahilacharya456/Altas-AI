import type { Response, NextFunction } from 'express';
import { auth } from '../lib/firebaseAdmin';
import { ApiError, type AuthedRequest } from '../lib/http';

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

    const decoded = await auth.verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
    };
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }
    next(new ApiError(401, 'Invalid or expired Firebase ID token.', 'unauthenticated'));
  }
};
