import type { ZodError } from 'zod';

import type { ErrorDetail } from './app-error';

export function formatZodError(error: ZodError): ErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
  }));
}
