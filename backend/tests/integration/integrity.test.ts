import request from 'supertest';

import { createApp } from '../../src/app';
import { prisma } from '@db/prisma';
import * as accountRepository from '@modules/account/account.repository';

import { resetDatabase } from '../helpers/database';
import { createTestAccount, createTestTransaction } from '../helpers/fixtures';
import { expectLedgerToReconcile, findUnreconciledAccounts } from '../helpers/ledger';

const app = createApp();

type MutatingMethod = 'put' | 'patch' | 'delete';

/** Deterministic PRNG so the randomised workload is reproducible on failure. */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe('405 METHOD_NOT_ALLOWED', () => {
  it.each<MutatingMethod>(['put', 'patch', 'delete'])(
    'rejects %s on a transaction and leaves it untouched',
    async (method) => {
      const account = await createTestAccount('Immutable', 50_00n);
      const transaction = await createTestTransaction(account.id, { amount: 5_00n });

      const response = await request(app)
        [method](`/api/v1/transactions/${transaction.id}`)
        .send({ amount: 1 });

      expect(response.status).toBe(405);
      expect(response.headers.allow).toBe('GET, HEAD');
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `Method ${method.toUpperCase()} is not allowed on /api/v1/transactions/${transaction.id}: transactions are immutable`,
        },
      });
      expect(await prisma.transaction.findUniqueOrThrow({ where: { id: transaction.id } })).toEqual(
        transaction,
      );
    },
  );

  it.each<[MutatingMethod | 'get', string, string]>([
    ['put', '/api/v1/transactions', 'POST'],
    ['delete', '/api/v1/transactions', 'POST'],
    ['get', '/api/v1/transactions', 'POST'],
    ['delete', '/api/v1/accounts/00000000-0000-4000-8000-000000000000/transactions', 'GET, HEAD'],
    ['patch', '/api/v1/accounts/00000000-0000-4000-8000-000000000000', 'GET, HEAD'],
    ['delete', '/api/v1/accounts/00000000-0000-4000-8000-000000000000', 'GET, HEAD'],
    ['put', '/api/v1/accounts', 'GET, HEAD, POST'],
    ['post', '/api/v1/health', 'GET, HEAD'],
  ] as Array<[MutatingMethod | 'get', string, string]>)(
    'rejects %s %s with Allow: %s',
    async (method, path, allow) => {
      const response = await request(app)[method](path);

      expect(response.status).toBe(405);
      expect(response.headers.allow).toBe(allow);
      expect(response.body.error.code).toBe('METHOD_NOT_ALLOWED');
    },
  );

  it('still returns 404 for paths that do not exist at all', async () => {
    const response = await request(app).delete('/api/v1/transactions/a/b');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});

describe('database-level immutability', () => {
  it('aborts the whole DB transaction when a ledger row mutation is attempted', async () => {
    const account = await createTestAccount('Tamper', 100_00n);

    await expect(
      prisma.$transaction(async (tx) => {
        await accountRepository.incrementAccountBalance(account.id, 1_000_00n, tx);
        await tx.$executeRaw`UPDATE "transactions" SET "amount" = "amount" * 10`;
      }),
    ).rejects.toThrow(/ledger records are immutable/);

    const reloaded = await prisma.account.findUniqueOrThrow({ where: { id: account.id } });
    expect(reloaded.balance).toBe(100_00n);
    await expectLedgerToReconcile();
  });
});

describe('balance reconciliation', () => {
  it('detects drift between a balance and its ledger', async () => {
    const account = await createTestAccount('Drifted', 10_00n);
    await prisma.$executeRaw`UPDATE "accounts" SET "balance" = "balance" + 1 WHERE "id" = ${account.id}::uuid`;

    expect(await findUnreconciledAccounts()).toEqual([
      { id: account.id, balance: 10_01n, ledger_balance: 10_00n },
    ]);
  });

  it('holds for every account after a concurrent mixed workload', async () => {
    const random = createSeededRandom(20_261_027);
    const accounts = await Promise.all(
      ['Alpha', 'Beta', 'Gamma'].map((name) => createTestAccount(name, 100_00n)),
    );
    const operations = Array.from({ length: 60 }, (_, index) => ({
      account_id: accounts[Math.floor(random() * accounts.length)]!.id,
      type: random() < 0.45 ? 'credit' : 'debit',
      amount: (Math.floor(random() * 6_000) / 100 + 0.01).toFixed(2),
      reference_id: `LOAD-${index}`,
    }));

    const responses = await Promise.all(
      operations.map((operation) => request(app).post('/api/v1/transactions').send(operation)),
    );

    const statuses = new Set(responses.map((response) => response.status));
    expect([...statuses].every((status) => status === 201 || status === 422)).toBe(true);
    expect(statuses.has(201)).toBe(true);
    await expectLedgerToReconcile();

    const balances = await prisma.account.findMany({ select: { balance: true } });
    expect(balances.every(({ balance }) => balance >= 0n)).toBe(true);
  });
});
