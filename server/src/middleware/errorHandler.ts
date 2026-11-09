import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { config } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError | multer.MulterError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ── Multer-specific errors ──────────────────────────────────────────────────
  if (err instanceof multer.MulterError) {
    let statusCode = 400;
    let message = `Upload error: ${err.message}`;

    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = 'File too large. Maximum size is 20 MB.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      statusCode = 400;
      message = `Unexpected field "${err.field}". Check the form field name.`;
    }

    res.status(statusCode).json({ success: false, status: statusCode, message });
    return;
  }

  // ── File-type filter rejections (set statusCode = 400 / 415 in fileFilter) ──
  const appErr = err as AppError;
  if (
    appErr.statusCode === 400 &&
    appErr.message &&
    appErr.message.includes('Only PDF, DOCX, PNG, and JPG')
  ) {
    res.status(400).json({ success: false, status: 400, message: appErr.message });
    return;
  }
  if (appErr.statusCode === 415) {
    res.status(415).json({ success: false, status: 415, message: appErr.message });
    return;
  }

  // ── Generic error handling ──────────────────────────────────────────────────
  const statusCode = appErr.statusCode || 500;
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

