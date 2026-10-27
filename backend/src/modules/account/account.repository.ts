import type { Account } from '@prisma/client';

import { prisma } from '@db/prisma';
import type { DbClient } from '@db/types';

export interface FindAccountsOptions {
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
