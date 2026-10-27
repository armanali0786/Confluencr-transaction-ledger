import { describe, expect, it } from 'vitest';

import { transactionFormSchema } from './transaction-form-schema';

const schema = transactionFormSchema('20.00');
const BASE = { reference_id: 'TXN-1', description: '' };

describe('transactionFormSchema', () => {
  it('lets a credit exceed the current balance', () => {
    expect(schema.safeParse({ ...BASE, type: 'credit', amount: '500' }).success).toBe(true);
  });

  it('allows a debit of the whole balance', () => {
    expect(schema.safeParse({ ...BASE, type: 'debit', amount: '20' }).success).toBe(true);
  });

  it('rejects a debit above the balance on the amount field', () => {
    const result = schema.safeParse({ ...BASE, type: 'debit', amount: '20.01' });

    expect(result.error?.issues).toEqual([
      expect.objectContaining({ path: ['amount'], message: 'Debit exceeds the current balance' }),
    ]);
  });
});
