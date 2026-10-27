import type { NextFunction, Request, Response } from 'express';

import { AppError } from '@shared/errors/app-error';
import { ErrorCode } from '@shared/errors/error-codes';

type HttpMethod = 'GET' | 'POST';

/**
 * Terminal handler for a route: any method not handled before it gets a 405 with an
 * `Allow` header, instead of falling through to the generic 404.
 */
export function methodNotAllowed(allowedMethods: HttpMethod[], reason?: string) {
  // Express answers HEAD with the GET handler, so advertise it whenever GET is allowed.
  const allowHeader = [...allowedMethods, ...(allowedMethods.includes('GET') ? ['HEAD'] : [])]
    .sort()
    .join(', ');

  return (req: Request, res: Response, next: NextFunction): void => {
    res.setHeader('Allow', allowHeader);
    const message = `Method ${req.method} is not allowed on ${req.originalUrl.split('?')[0]}`;
    next(new AppError(ErrorCode.METHOD_NOT_ALLOWED, reason ? `${message}: ${reason}` : message));
  };
}
