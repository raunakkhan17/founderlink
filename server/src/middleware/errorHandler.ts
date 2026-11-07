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
  const isDevelopment = (process.env.NODE_ENV || config.NODE_ENV) === 'development';
  const isProduction = (process.env.NODE_ENV || config.NODE_ENV) === 'production';

  if (process.env.NODE_ENV !== 'test') {
    console.error('[Error]', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  // In production, return a safe message for unhandled/internal (500) errors
  let safeMessage = err.message || 'Internal Server Error';
  if (isProduction && statusCode === 500 && !err.isOperational) {
    safeMessage = 'Internal Server Error';
  }

  const responseBody: Record<string, any> = {
    success: false,
    status: statusCode,
    message: safeMessage,
  };

  if (isDevelopment) {
    responseBody.stack = err.stack;
  }

  res.status(statusCode).json(responseBody);
};

