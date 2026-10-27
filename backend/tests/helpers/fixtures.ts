import { randomUUID } from 'node:crypto';

import { type Prisma, TransactionType } from '@prisma/client';

import { prisma } from '@db/prisma';

export const UNKNOWN_UUID = '00000000-0000-4000-8000-000000000000';

export const OPENING_BALANCE_REFERENCE = 'OPENING-BALANCE';

/**
 * A non-zero starting balance is backed by an opening credit, so test data always
 * satisfies the ledger invariant: balance == SUM(credits) - SUM(debits).
 */
export function createTestAccount(name = 'Test Account', balance = 0n) {
  return prisma.account.create({
    data: {
      name,
      balance,
      ...(balance > 0n && {
        transactions: {
          create: {
            type: TransactionType.credit,
            amount: balance,
            referenceId: OPENING_BALANCE_REFERENCE,
          },
        },
      }),
    },
  });
}

/** Inserts a ledger row directly (bypassing the service) to set up read-side scenarios. */
export function createTestTransaction(
  accountId: string,
  overrides: Partial<Prisma.TransactionUncheckedCreateInput> = {},
) {
  return prisma.transaction.create({
    data: {
      accountId,
      type: TransactionType.credit,
      amount: 10_00n,
      referenceId: `REF-${randomUUID()}`,
      ...overrides,
    },
  });
}
