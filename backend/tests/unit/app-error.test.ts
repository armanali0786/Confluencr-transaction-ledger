import { AppError } from '@shared/errors/app-error';
import { ErrorCode } from '@shared/errors/error-codes';

describe('AppError', () => {
  it('derives the HTTP status from the error code', () => {
    const error = new AppError(ErrorCode.INSUFFICIENT_BALANCE, 'Not enough funds');

    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
    expect(error.message).toBe('Not enough funds');
    expect(error.details).toBeUndefined();
  });

  it('keeps validation details', () => {
    const details = [{ field: 'amount', message: 'Amount must be greater than 0' }];
    const error = new AppError(ErrorCode.VALIDATION_ERROR, 'Request validation failed', details);

    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual(details);
  });
});
