import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const incoming = req.header('x-request-id');
  req.requestId = incoming && incoming.length <= 120 ? incoming : randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
};
