import { describe, expect, it } from 'vitest';

import type { Account } from '@/types/api';

import { transferFormSchema } from './transfer-form-schema';

const ACCOUNTS: Account[] = [
  { id: 'a', name: 'A', balance: '100.00', created_at: '', updated_at: '' },
  { id: 'b', name: 'B', balance: '50.00', created_at: '', updated_at: '' },
];

const VALID = {
  from_account_id: 'a',
  to_account_id: 'b',
  amount: '30',
  reference_id: 'TRF-1',
  description: '',
};

function messagesFor(values: Partial<typeof VALID>): Record<string, string> {
  const result = transferFormSchema(ACCOUNTS).safeParse({ ...VALID, ...values });
  return Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [issue.path.join('.'), issue.message]),
  );
}

describe('transferFormSchema', () => {
  it('accepts a valid transfer', () => {
    expect(messagesFor({})).toEqual({});
  });

  it('rejects transferring to the same account', () => {
    expect(messagesFor({ to_account_id: 'a' })).toEqual({
      to_account_id: 'Choose two different accounts',
    });
  });

  it('rejects an amount above the source balance', () => {
    expect(messagesFor({ amount: '100.01' })).toEqual({
      amount: 'Amount exceeds the source account balance',
    });
  });

  it('requires both accounts', () => {
    expect(messagesFor({ from_account_id: '', to_account_id: '' })).toMatchObject({
      from_account_id: 'Choose the account to send from',
      to_account_id: 'Choose the account to send to',
    });
  });
});
