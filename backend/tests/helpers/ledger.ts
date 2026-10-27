import { prisma } from '@db/prisma';

export interface UnreconciledAccount {
  id: string;
  balance: bigint;
  ledger_balance: bigint;
}

/** Accounts whose stored balance differs from SUM(credits) - SUM(debits) of their ledger. */
export function findUnreconciledAccounts(): Promise<UnreconciledAccount[]> {
  return prisma.$queryRaw<UnreconciledAccount[]>`
    SELECT a."id", a."balance", COALESCE(l."ledger_balance", 0)::bigint AS "ledger_balance"
    FROM "accounts" a
    LEFT JOIN (
      SELECT "account_id",
             SUM(CASE WHEN "type" = 'credit' THEN "amount" ELSE -"amount" END) AS "ledger_balance"
      FROM "transactions"
      GROUP BY "account_id"
    ) l ON l."account_id" = a."id"
    WHERE a."balance" <> COALESCE(l."ledger_balance", 0)
  `;
}

export async function expectLedgerToReconcile(): Promise<void> {
  expect(await findUnreconciledAccounts()).toEqual([]);
}
