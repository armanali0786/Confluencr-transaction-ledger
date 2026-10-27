import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'X-Request-Id';

// Only trust well-formed upstream ids so arbitrary header content never reaches the logs.
const VALID_REQUEST_ID = /^[\w-]{1,128}$/;

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.get(REQUEST_ID_HEADER);
  const id = incomingId && VALID_REQUEST_ID.test(incomingId) ? incomingId : randomUUID();

  req.id = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
}
