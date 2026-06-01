export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Common error factory functions
export const BadRequestError = (message: string, code = 'BAD_REQUEST') =>
  new AppError(message, 400, code);

export const UnauthorizedError = (message = 'Unauthorized', code = 'UNAUTHORIZED') =>
  new AppError(message, 401, code);

export const ForbiddenError = (message = 'Forbidden', code = 'FORBIDDEN') =>
  new AppError(message, 403, code);

export const NotFoundError = (message = 'Not found', code = 'NOT_FOUND') =>
  new AppError(message, 404, code);

export const ConflictError = (message: string, code = 'CONFLICT') =>
  new AppError(message, 409, code);

export const ValidationError = (message: string, code = 'VALIDATION_ERROR') =>
  new AppError(message, 422, code);

export const TooManyRequestsError = (message = 'Too many requests', code = 'RATE_LIMIT') =>
  new AppError(message, 429, code);

export const InternalError = (message = 'Internal server error', code = 'INTERNAL_ERROR') =>
  new AppError(message, 500, code);
