import { Request, Response, NextFunction } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../config/env.js';
import { UnauthorizedError } from '../shared/errors/AppError.js';

interface JwtPayload {
  userId: string;
  email: string;
  disciplineLevel: string;
  type: 'access' | 'refresh';
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw UnauthorizedError('No authentication token provided');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw UnauthorizedError('No authentication token provided');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    if (decoded.type !== 'access') {
      throw UnauthorizedError('Invalid token type');
    }

    req.userId = new Types.ObjectId(decoded.userId);
    req.user = {
      id: new Types.ObjectId(decoded.userId),
      email: decoded.email,
      disciplineLevel: decoded.disciplineLevel,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(UnauthorizedError('Invalid authentication token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(UnauthorizedError('Authentication token has expired'));
    } else {
      next(error);
    }
  }
};

// Optional authentication - doesn't fail if no token, but populates user if present
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      if (decoded.type === 'access') {
        req.userId = new Types.ObjectId(decoded.userId);
        req.user = {
          id: new Types.ObjectId(decoded.userId),
          email: decoded.email,
          disciplineLevel: decoded.disciplineLevel,
        };
      }
    } catch {
      // Token invalid, but continue without auth
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Generate tokens
export const generateTokens = (
  userId: string,
  email: string,
  disciplineLevel: string
): { accessToken: string; refreshToken: string } => {
  const accessOptions: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  const refreshOptions: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };

  const accessToken = jwt.sign(
    { userId, email, disciplineLevel, type: 'access' },
    env.JWT_SECRET,
    accessOptions
  );

  const refreshToken = jwt.sign(
    { userId, email, disciplineLevel, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    refreshOptions
  );

  return { accessToken, refreshToken };
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;

  if (decoded.type !== 'refresh') {
    throw UnauthorizedError('Invalid token type');
  }

  return decoded;
};
