import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error('[Error]', {
    message: err.message,
    stack: err.stack,
    statusCode,
  });

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
