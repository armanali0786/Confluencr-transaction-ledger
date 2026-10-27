import type { ZodError } from 'zod';

import type { ErrorDetail } from './app-error';

type ZodIssue = ZodError['issues'][number];

function joinPath(path: PropertyKey[], key?: string): string {
  return [...path, ...(key === undefined ? [] : [key])].map(String).join('.') || 'root';
}

function toErrorDetails(issue: ZodIssue): ErrorDetail[] {
  // Zod reports all unknown keys in one issue on the parent; report each field separately.
  if (issue.code === 'unrecognized_keys') {
    return issue.keys.map((key) => ({
      field: joinPath(issue.path, key),
      message: 'Unknown field is not allowed',
    }));
  }

  return [{ field: joinPath(issue.path), message: issue.message }];
}

export function formatZodError(error: ZodError): ErrorDetail[] {
  return error.issues.flatMap(toErrorDetails);
}
