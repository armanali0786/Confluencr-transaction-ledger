import type { NextFunction, Request, Response } from 'express';

import { AppError } from '@shared/errors/app-error';
import { ErrorCode } from '@shared/errors/error-codes';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(ErrorCode.ROUTE_NOT_FOUND, `Route ${req.method} ${req.path} not found`));
}
