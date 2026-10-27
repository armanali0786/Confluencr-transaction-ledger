import type { NextFunction, Request, Response } from 'express';

import { logger } from '@config/logger';
import { toAppError } from '@shared/errors/to-app-error';
import { buildErrorResponse } from '@shared/utils/api-response';

const SERVER_ERROR_STATUS = 500;

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error);
    return;
  }

  const appError = toAppError(error);

  // Server-side failures are logged with the original error; clients only see the safe message.
  if (appError.statusCode >= SERVER_ERROR_STATUS) {
    // req.log is absent when the error happens before the HTTP logger runs.
    (req.log ?? logger).error({ err: error }, appError.message);
  }

  res
    .status(appError.statusCode)
    .json(buildErrorResponse(appError.code, appError.message, appError.details));
}
