import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../shared/errors/AppError.js';
import { sendError } from '../shared/utils/response.utils.js';
import { env } from '../config/env.js';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error in development
  if (env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    sendError(res, 422, 'VALIDATION_ERROR', 'Validation failed', details);
    return;
  }

  // Handle AppError (our custom errors)
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message);
    return;
  }

  // Handle MongoDB duplicate key error
  if ((err as { code?: number }).code === 11000) {
    sendError(res, 409, 'DUPLICATE_KEY', 'A record with this value already exists');
    return;
  }

  // Handle MongoDB validation error
  if (err.name === 'ValidationError') {
    sendError(res, 422, 'VALIDATION_ERROR', err.message);
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    sendError(res, 401, 'INVALID_TOKEN', 'Invalid authentication token');
    return;
  }

  if (err.name === 'TokenExpiredError') {
    sendError(res, 401, 'TOKEN_EXPIRED', 'Authentication token has expired');
    return;
  }

  // Handle MongoDB cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    sendError(res, 400, 'INVALID_ID', 'Invalid ID format');
    return;
  }

  // Default: Internal server error
  const message = env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
  sendError(res, 500, 'INTERNAL_ERROR', message);
};

// Handle uncaught exceptions
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (err: Error) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);
    process.exit(1);
  });
};

// Handle unhandled promise rejections
export const handleUnhandledRejection = (server: { close: (callback: () => void) => void }): void => {
  process.on('unhandledRejection', (err: Error) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
};
