import { NextFunction, Request, Response } from 'express';

/**
 * Wraps an async Express route handler so rejected promises are forwarded
 * to Express's error-handling middleware instead of crashing the request.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

type RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;
