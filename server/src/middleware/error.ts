import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { config } from '../config';

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      },
    });
    return;
  }

  const appErr = err as AppError;
  const statusCode = appErr.statusCode || 500;
  const errorBody: { code: string; message: string; stack?: string } = {
    code: appErr.code || 'INTERNAL_SERVER_ERROR',
    message: appErr.message || 'Internal server error',
  };

  if (config.nodeEnv === 'development' && appErr.stack) {
    errorBody.stack = appErr.stack;
  }

  res.status(statusCode).json({ error: errorBody });
}
