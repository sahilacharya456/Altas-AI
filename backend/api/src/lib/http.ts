import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = 'api_error'
  ) {
    super(message);
  }
}

export interface AuthedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export const asyncHandler =
  (handler: (req: AuthedRequest, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req as AuthedRequest, res, next)).catch(next);
  };

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        requestId: req.requestId,
      },
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Invalid request body.',
        requestId: req.requestId,
        issues: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
  }

  logger.error('request.unhandled_error', {
    requestId: req.requestId,
    error: error instanceof Error ? error.message : String(error),
  });
  return res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'Request failed.',
      requestId: req.requestId,
    },
  });
};
