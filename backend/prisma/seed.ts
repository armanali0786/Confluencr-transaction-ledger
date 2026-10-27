import { PrismaClient, TransactionType } from '@prisma/client';

import { logger } from '@config/logger';

const prisma = new PrismaClient();

interface SeedTransaction {
  type: TransactionType;
  /** Minor units (paise/cents): 100_00n is 100.00. */
  amount: bigint;
  referenceId: string;
  description: string;
}

interface SeedAccount {
  id: string;
  name: string;
  transactions: SeedTransaction[];
}

const MINUTE_MS = 60_000;

const SEED_ACCOUNTS: SeedAccount[] = [
  {
    id: '6f1c2a3b-4d5e-4f60-8a7b-1c2d3e4f5a01',
    name: 'Alice Operating Account',
    transactions: [
      {
        type: TransactionType.credit,
        amount: 1000_00n,
        referenceId: 'SEED-ALICE-001',
        description: 'Opening deposit',
      },
      {
        type: TransactionType.debit,
        amount: 250_50n,
        referenceId: 'SEED-ALICE-002',
        description: 'Office rent',
      },
      {
        type: TransactionType.debit,
        amount: 49_99n,
        referenceId: 'SEED-ALICE-003',
        description: 'Software subscription',
      },
    ],
  },
  {
    id: '6f1c2a3b-4d5e-4f60-8a7b-1c2d3e4f5a02',
    name: 'Bob Savings',
    transactions: [
      {
        type: TransactionType.credit,
        amount: 500_00n,
        referenceId: 'SEED-BOB-001',
        description: 'Salary',
      },
      {
        type: TransactionType.debit,
        amount: 120_00n,
        referenceId: 'SEED-BOB-002',
        description: 'Groceries',
      },
    ],
  },
  {
    id: '6f1c2a3b-4d5e-4f60-8a7b-1c2d3e4f5a03',
    name: 'Carol Petty Cash',
    transactions: [],
  },
];

function calculateBalance(transactions: SeedTransaction[]): bigint {
  return transactions.reduce(
    (balance, { type, amount }) =>
      type === TransactionType.credit ? balance + amount : balance - amount,
    0n,
  );
}

/** Returns false when the account already exists; ledger rows are immutable, so re-seeding never rewrites them. */
async function seedAccount({ id, name, transactions }: SeedAccount): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.account.findUnique({ where: { id }, select: { id: true } });
    if (existing) return false;

    const seededAt = Date.now();
    await tx.account.create({
      data: {
        id,
        name,
        balance: calculateBalance(transactions),
        transactions: {
          create: transactions.map((transaction, index) => ({
            ...transaction,
            // Spread timestamps so "latest first" ordering is visible in the demo data.
            createdAt: new Date(seededAt - (transactions.length - index) * MINUTE_MS),
          })),
        },
      },
    });
    return true;
  });
}

async function main(): Promise<void> {
  for (const account of SEED_ACCOUNTS) {
    const created = await seedAccount(account);
    logger.info(
      { accountId: account.id },
      `${created ? 'Seeded' : 'Skipped existing'} ${account.name}`,
    );
  }
}

main()
  .catch((error: unknown) => {
    logger.error({ err: error }, 'Seeding failed');
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
