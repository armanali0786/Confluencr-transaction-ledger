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

export interface FindAccountTransactionsOptions {
  accountId: string;
  skip: number;
  take: number;
}

export function findTransactionById(
  id: string,
  db: DbClient = prisma,
): Promise<Transaction | null> {
  return db.transaction.findUnique({ where: { id } });
}

/** Latest first; `id` breaks ties between rows written in the same instant so pages are stable. */
export function findTransactionsByAccount(
  { accountId, skip, take }: FindAccountTransactionsOptions,
  db: DbClient = prisma,
): Promise<Transaction[]> {
  return db.transaction.findMany({
    where: { accountId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip,
    take,
  });
}

export function countTransactionsByAccount(
  accountId: string,
  db: DbClient = prisma,
): Promise<number> {
  return db.transaction.count({ where: { accountId } });
}
