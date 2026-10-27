import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';

import { ApiError, describeApiError, NETWORK_ERROR, toApiError, UNKNOWN_ERROR } from './errors';

function buildAxiosError(status?: number, data?: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  const response = status
    ? ({ status, data, statusText: '', headers: {}, config } as AxiosResponse)
    : undefined;
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, response);
}

describe('toApiError', () => {
  it('unwraps the API error envelope', () => {
    const error = toApiError(
      buildAxiosError(422, {
        success: false,
        error: { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance for this debit' },
      }),
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 422,
      code: 'INSUFFICIENT_BALANCE',
      message: 'Insufficient balance for this debit',
      details: [],
      isClientError: true,
    });
  });

  it('keeps validation details', () => {
    const details = [{ field: 'amount', message: 'amount must be greater than 0' }];
    const error = toApiError(
      buildAxiosError(400, {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details },
      }),
    );

    expect(error.details).toEqual(details);
  });

  it('reports a network failure when there is no response', () => {
    const error = toApiError(buildAxiosError());

    expect(error.code).toBe(NETWORK_ERROR);
    expect(error.status).toBeNull();
    expect(error.isClientError).toBe(false);
  });

  it('handles a non-envelope error body', () => {
    const error = toApiError(buildAxiosError(502, '<html>Bad gateway</html>'));

    expect(error).toMatchObject({ status: 502, code: UNKNOWN_ERROR, isClientError: false });
  });

  it('wraps non-Axios errors and passes ApiErrors through', () => {
    const existing = new ApiError(404, 'ACCOUNT_NOT_FOUND', 'Account not found');

    expect(toApiError(existing)).toBe(existing);
    expect(toApiError(new Error('boom')).code).toBe(UNKNOWN_ERROR);
  });
});

describe('describeApiError', () => {
  it('uses the message when there are no details', () => {
    expect(describeApiError(new ApiError(409, 'DUPLICATE_TRANSACTION', 'Already used'))).toBe(
      'Already used',
    );
  });

  it('joins capitalised field messages', () => {
    const error = new ApiError(400, 'VALIDATION_ERROR', 'Request validation failed', [
      { field: 'amount', message: 'amount must be greater than 0' },
      { field: 'reference_id', message: 'reference_id must not be empty' },
    ]);

    expect(describeApiError(error)).toBe(
      'Amount must be greater than 0. Reference_id must not be empty',
    );
  });
});
