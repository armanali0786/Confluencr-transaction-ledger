import type { Account } from '@prisma/client';

import { prisma } from '@db/prisma';
import type { DbClient } from '@db/types';

interface FindAccountsOptions {
  skip: number;
  take: number;
}

export function insertAccount(name: string, db: DbClient = prisma): Promise<Account> {
  return db.account.create({ data: { name } });
}

export function findAccountById(id: string, db: DbClient = prisma): Promise<Account | null> {
  return db.account.findUnique({ where: { id } });
}

export function findAccounts(
  { skip, take }: FindAccountsOptions,
  db: DbClient = prisma,
): Promise<Account[]> {
  return db.account.findMany({
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip,
    take,
  });
}

export function countAccounts(db: DbClient = prisma): Promise<number> {
  return db.account.count();
}

export interface LockedAccount {
  id: string;
  balance: bigint;
}

/**
 * Takes a row-level lock that is held until the surrounding DB transaction ends, so
 * concurrent writers for the same account are serialised and read a fresh balance.
 * Must be called inside `prisma.$transaction`.
 */
export async function lockAccountById(id: string, db: DbClient): Promise<LockedAccount | null> {
  const rows = await db.$queryRaw<LockedAccount[]>`
    SELECT "id", "balance" FROM "accounts" WHERE "id" = ${id}::uuid FOR UPDATE
  `;
  return rows[0] ?? null;
}

/** Applies a signed delta atomically in SQL (balance = balance + delta). */
export function incrementAccountBalance(id: string, delta: bigint, db: DbClient): Promise<Account> {
  return db.account.update({ where: { id }, data: { balance: { increment: delta } } });
}
