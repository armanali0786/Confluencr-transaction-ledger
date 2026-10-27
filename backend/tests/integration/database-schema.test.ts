import { Prisma, TransactionType } from '@prisma/client';

import { prisma } from '@db/prisma';

import { resetDatabase } from '../helpers/database';

async function createAccount(balance = 0n) {
  return prisma.account.create({ data: { name: 'Schema Test Account', balance } });
}

async function createTransaction(accountId: string, referenceId = 'REF-001') {
  return prisma.transaction.create({
    data: { accountId, type: TransactionType.credit, amount: 100_00n, referenceId },
  });
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe('ledger immutability trigger', () => {
  it('rejects UPDATE on transactions', async () => {
    const account = await createAccount(100_00n);
    await createTransaction(account.id);

    await expect(prisma.$executeRaw`UPDATE "transactions" SET "amount" = 1`).rejects.toThrow(
      /UPDATE on "transactions" is not allowed/,
    );
  });

  it('rejects DELETE on transactions', async () => {
    const account = await createAccount(100_00n);
    await createTransaction(account.id);

    await expect(prisma.$executeRaw`DELETE FROM "transactions"`).rejects.toThrow(
      /DELETE on "transactions" is not allowed/,
    );
    expect(await prisma.transaction.count()).toBe(1);
  });

  it('rejects mutation through the Prisma client as well', async () => {
    const account = await createAccount(100_00n);
    const transaction = await createTransaction(account.id);

    await expect(
      prisma.transaction.update({ where: { id: transaction.id }, data: { amount: 1n } }),
    ).rejects.toThrow(/immutable/);
  });

  it('rejects UPDATE and DELETE on transfers', async () => {
    await expect(prisma.$executeRaw`UPDATE "transfers" SET "amount" = 1`).rejects.toThrow(
      /UPDATE on "transfers" is not allowed/,
    );
    await expect(prisma.$executeRaw`DELETE FROM "transfers"`).rejects.toThrow(
      /DELETE on "transfers" is not allowed/,
    );
  });
});

describe('check constraints', () => {
  it('rejects a negative account balance', async () => {
    const account = await createAccount(10_00n);

    await expect(
      prisma.account.update({ where: { id: account.id }, data: { balance: -1n } }),
    ).rejects.toThrow(/accounts_balance_non_negative/);
  });

  it('rejects a blank account name', async () => {
    await expect(prisma.account.create({ data: { name: '   ' } })).rejects.toThrow(
      /accounts_name_not_blank/,
    );
  });

  it.each([0n, -5_00n])('rejects a transaction amount of %s', async (amount) => {
    const account = await createAccount();

    await expect(
      prisma.transaction.create({
        data: { accountId: account.id, type: TransactionType.credit, amount, referenceId: 'R' },
      }),
    ).rejects.toThrow(/transactions_amount_positive/);
  });

  it('rejects a transfer to the same account', async () => {
    const account = await createAccount(100_00n);

    await expect(
      prisma.transfer.create({
        data: {
          fromAccountId: account.id,
          toAccountId: account.id,
          amount: 10_00n,
          referenceId: 'TRF-001',
        },
      }),
    ).rejects.toThrow(/transfers_distinct_accounts/);
  });
});

describe('reference uniqueness', () => {
  it('rejects a duplicate reference_id on the same account', async () => {
    const account = await createAccount();
    await createTransaction(account.id, 'DUP-REF');

    const duplicate = createTransaction(account.id, 'DUP-REF');

    await expect(duplicate).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    await expect(duplicate).rejects.toMatchObject({ code: 'P2002' });
  });

  it('allows the same reference_id on different accounts', async () => {
    const first = await createAccount();
    const second = await createAccount();

    await createTransaction(first.id, 'SHARED-REF');
    await expect(createTransaction(second.id, 'SHARED-REF')).resolves.toBeDefined();
  });
});

describe('accounts.updated_at trigger', () => {
  it('bumps updated_at on raw SQL balance updates', async () => {
    // Start from a fixed past timestamp so the assertion never races the clock.
    const staleUpdatedAt = new Date('2020-01-01T00:00:00.000Z');
    const account = await prisma.account.create({
      data: { name: 'Stale', createdAt: staleUpdatedAt, updatedAt: staleUpdatedAt },
    });

    await prisma.$executeRaw`UPDATE "accounts" SET "balance" = "balance" + 100 WHERE "id" = ${account.id}::uuid`;
    const updated = await prisma.account.findUniqueOrThrow({ where: { id: account.id } });

    expect(updated.balance).toBe(100n);
    expect(updated.updatedAt.getTime()).toBeGreaterThan(staleUpdatedAt.getTime());
  });
});
