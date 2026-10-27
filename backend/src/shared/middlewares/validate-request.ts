import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

import { AppError, type ErrorDetail } from '@shared/errors/app-error';
import { ErrorCode } from '@shared/errors/error-codes';
import { formatZodError } from '@shared/errors/format-zod-error';

export interface RequestSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

type RequestPart = keyof RequestSchemas;

const REQUEST_PARTS: RequestPart[] = ['params', 'query', 'body'];

export function validateRequest(schemas: RequestSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const details: ErrorDetail[] = [];

    for (const part of REQUEST_PARTS) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);
      if (result.success) {
        // Replace raw input with parsed output so controllers get trimmed/coerced values.
        req[part] = result.data;
      } else {
        details.push(...formatZodError(result.error));
      }
    }

    if (details.length > 0) {
      next(new AppError(ErrorCode.VALIDATION_ERROR, 'Request validation failed', details));
      return;
    }

    next();
  };
}
