import type { Transaction, TransactionType } from '@prisma/client';

import { prisma } from '@db/prisma';
import type { DbClient } from '@db/types';

export interface NewTransaction {
  accountId: string;
  type: TransactionType;
  amount: bigint;
  referenceId: string;
  description: string | null;
  transferId?: string;
}

export function insertTransaction(data: NewTransaction, db: DbClient): Promise<Transaction> {
  return db.transaction.create({ data });
}

export function findTransactionByReference(
  accountId: string,
  referenceId: string,
  db: DbClient = prisma,
): Promise<Transaction | null> {
  return db.transaction.findUnique({
    where: { accountId_referenceId: { accountId, referenceId } },
  });
}
