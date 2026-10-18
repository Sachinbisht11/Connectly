import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

type Source = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }
    // Replace the source with the parsed (coerced/trimmed) data.
    req[source] = result.data as never;
    next();
  };
}
