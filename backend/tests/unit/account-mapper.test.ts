import type { Account } from '@prisma/client';

import { toAccountResponse } from '@modules/account/account.mapper';

describe('toAccountResponse', () => {
  it('converts minor units to a decimal string and uses snake_case fields', () => {
    const account: Account = {
      id: '6f1c2a3b-4d5e-4f60-8a7b-1c2d3e4f5a01',
      name: 'Alice',
      balance: 699_51n,
      createdAt: new Date('2026-01-01T10:00:00.000Z'),
      updatedAt: new Date('2026-01-02T10:00:00.000Z'),
    };

    expect(toAccountResponse(account)).toEqual({
      id: account.id,
      name: 'Alice',
      balance: '699.51',
      created_at: '2026-01-01T10:00:00.000Z',
      updated_at: '2026-01-02T10:00:00.000Z',
    });
  });
});
