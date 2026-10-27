import type { Transfer } from '@prisma/client';

import type { DbClient } from '@db/types';

export interface NewTransfer {
  fromAccountId: string;
  toAccountId: string;
  amount: bigint;
  referenceId: string;
  description: string | null;
}

export function insertTransfer(data: NewTransfer, db: DbClient): Promise<Transfer> {
  return db.transfer.create({ data });
}

export function findTransferByReference(
  referenceId: string,
  db: DbClient,
): Promise<Transfer | null> {
  return db.transfer.findUnique({ where: { referenceId } });
}
