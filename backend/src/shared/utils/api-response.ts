import type { Response } from 'express';

import type { ErrorDetail } from '@shared/errors/app-error';
import type { ErrorCode } from '@shared/errors/error-codes';

export interface SuccessResponse<TData, TMeta = Record<string, unknown>> {
  success: true;
  data: TData;
  meta?: TMeta;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  };
}

interface SendSuccessOptions<TMeta> {
  statusCode?: number;
  meta?: TMeta;
}

export function sendSuccess<TData, TMeta = Record<string, unknown>>(
  res: Response,
  data: TData,
  { statusCode = 200, meta }: SendSuccessOptions<TMeta> = {},
): void {
  const body: SuccessResponse<TData, TMeta> = { success: true, data, ...(meta && { meta }) };
  res.status(statusCode).json(body);
}

export function buildErrorResponse(
  code: ErrorCode,
  message: string,
  details?: ErrorDetail[],
): ErrorResponse {
  return { success: false, error: { code, message, ...(details?.length && { details }) } };
}
