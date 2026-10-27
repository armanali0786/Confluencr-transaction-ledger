import { assertSufficientBalance } from '@modules/transaction/transaction.service';
import type { AppError } from '@shared/errors/app-error';
import { ErrorCode } from '@shared/errors/error-codes';

describe('assertSufficientBalance', () => {
  it('allows a debit up to the full balance', () => {
    expect(() => assertSufficientBalance(100_00n, 100_00n)).not.toThrow();
  });

  it('rejects a debit larger than the balance', () => {
    expect(() => assertSufficientBalance(100_00n, 100_01n)).toThrow(
      expect.objectContaining<Partial<AppError>>({ code: ErrorCode.INSUFFICIENT_BALANCE }),
    );
  });
});
