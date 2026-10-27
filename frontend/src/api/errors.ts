import { isAxiosError } from 'axios';

import type { ApiErrorDetail, ApiErrorEnvelope } from '@/types/api';

export const NETWORK_ERROR = 'NETWORK_ERROR';
export const UNKNOWN_ERROR = 'UNKNOWN_ERROR';

export class ApiError extends Error {
  readonly status: number | null;
  readonly code: string;
  readonly details: ApiErrorDetail[];

  constructor(
    status: number | null,
    code: string,
    message: string,
    details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isClientError(): boolean {
    return this.status !== null && this.status >= 400 && this.status < 500;
  }
}

function isErrorEnvelope(body: unknown): body is ApiErrorEnvelope {
  if (typeof body !== 'object' || body === null) return false;
  const { success, error } = body as Partial<ApiErrorEnvelope>;
  return success === false && typeof error?.code === 'string' && typeof error.message === 'string';
}

/** Normalises anything thrown by an API call into an ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    const { response } = error;
    if (!response) {
      return new ApiError(
        null,
        NETWORK_ERROR,
        'Cannot reach the server. Check your connection and try again.',
      );
    }
    if (isErrorEnvelope(response.data)) {
      const { code, message, details } = response.data.error;
      return new ApiError(response.status, code, message, details);
    }
    return new ApiError(response.status, UNKNOWN_ERROR, `Request failed (HTTP ${response.status})`);
  }

  return new ApiError(null, UNKNOWN_ERROR, 'Something went wrong. Please try again.');
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A human-readable sentence: field-level details are more useful than a generic summary. */
export function describeApiError(error: ApiError): string {
  if (error.details.length === 0) return error.message;
  return error.details.map((detail) => capitalise(detail.message)).join('. ');
}
