import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { toApiError } from '@/api/errors';

const CODE_TO_FIELD_MESSAGE: Record<string, { field: string; message: string }> = {
  DUPLICATE_TRANSACTION: {
    field: 'reference_id',
    message: 'This reference ID has already been used. Use a new one.',
  },
  INSUFFICIENT_BALANCE: { field: 'amount', message: 'Amount exceeds the available balance.' },
  SAME_ACCOUNT_TRANSFER: { field: 'to_account_id', message: 'Choose a different account.' },
};

/**
 * Shows API errors next to the fields they belong to. Form field names match the API's
 * snake_case names, so validation details map across directly.
 */
export function applyServerErrors<TValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TValues>,
  fields: ReadonlyArray<Path<TValues>>,
): void {
  const apiError = toApiError(error);
  const isFormField = (field: string): field is Path<TValues> =>
    (fields as readonly string[]).includes(field);

  for (const detail of apiError.details) {
    if (isFormField(detail.field)) {
      setError(detail.field, { type: 'server', message: detail.message });
    }
  }

  const mapped = CODE_TO_FIELD_MESSAGE[apiError.code];
  if (mapped && isFormField(mapped.field)) {
    setError(mapped.field, { type: 'server', message: mapped.message });
  }
}
