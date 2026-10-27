import { Prisma } from '@prisma/client';
import request from 'supertest';

import { createApp } from '../../src/app';
import { prisma } from '@db/prisma';
import * as accountRepository from '@modules/account/account.repository';
import * as transactionRepository from '@modules/transaction/transaction.repository';

import { resetDatabase } from '../helpers/database';
import { createTestAccount, UNKNOWN_UUID } from '../helpers/fixtures';

const app = createApp();
const TRANSACTIONS_URL = '/api/v1/transactions';

interface TransactionInput {
  account_id: string;
  type: 'credit' | 'debit';
  amount: number | string;
  reference_id: string;
  description?: string;
}

function postTransaction(body: TransactionInput) {
  return request(app).post(TRANSACTIONS_URL).send(body);
}

async function getBalance(accountId: string): Promise<bigint> {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  return account.balance;
}

beforeEach(async () => {
  await resetDatabase();
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe('POST /api/v1/transactions', () => {
  it('records a credit and returns the transaction with the new balance', async () => {
    const account = await createTestAccount();

    const response = await postTransaction({
      account_id: account.id,
      type: 'credit',
      amount: 100,
      reference_id: 'DEP-001',
      description: 'Opening deposit',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      data: {
        transaction: {
          id: expect.stringMatching(/^[0-9a-f-]{36}$/),
          account_id: account.id,
          type: 'credit',
          amount: '100.00',
          description: 'Opening deposit',
          reference_id: 'DEP-001',
          transfer_id: null,
          created_at: expect.any(String),
        },
        account: expect.objectContaining({ id: account.id, balance: '100.00' }),
      },
    });
  });

  it('runs the assessment example 0 → +100 → +50 → −30 → −20 and ends at 100', async () => {
    const account = await createTestAccount();
    const steps: Array<[TransactionInput['type'], number, string]> = [
      ['credit', 100, '100.00'],
      ['credit', 50, '150.00'],
      ['debit', 30, '120.00'],
      ['debit', 20, '100.00'],
    ];

    for (const [index, [type, amount, expectedBalance]] of steps.entries()) {
      const response = await postTransaction({
        account_id: account.id,
        type,
        amount,
        reference_id: `STEP-${index}`,
      });

      expect(response.status).toBe(201);
      expect(response.body.data.account.balance).toBe(expectedBalance);
    }

    expect(await getBalance(account.id)).toBe(100_00n);
    expect(await prisma.transaction.count({ where: { accountId: account.id } })).toBe(4);
  });

  it('accepts decimal amounts without floating-point drift', async () => {
    const account = await createTestAccount();

    await postTransaction({
      account_id: account.id,
      type: 'credit',
      amount: 0.1,
      reference_id: 'A',
    });
    await postTransaction({
      account_id: account.id,
      type: 'credit',
      amount: 0.2,
      reference_id: 'B',
    });

    expect(await getBalance(account.id)).toBe(30n);
  });

  it('allows a debit of the entire balance', async () => {
    const account = await createTestAccount('Exact', 50_00n);

    const response = await postTransaction({
      account_id: account.id,
      type: 'debit',
      amount: '50.00',
      reference_id: 'ALL-IN',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.account.balance).toBe('0.00');
  });

  it('rejects a debit above the balance with 422 and changes nothing', async () => {
    const account = await createTestAccount('Low', 10_00n);

    const response = await postTransaction({
      account_id: account.id,
      type: 'debit',
      amount: 10.01,
      reference_id: 'OVERDRAW',
    });

    expect(response.status).toBe(422);
    expect(response.body.error).toEqual({
      code: 'INSUFFICIENT_BALANCE',
      message: 'Insufficient balance for this debit',
    });
    expect(await getBalance(account.id)).toBe(10_00n);
    expect(await prisma.transaction.count()).toBe(0);
  });

  it('returns 404 ACCOUNT_NOT_FOUND for an unknown account', async () => {
    const response = await postTransaction({
      account_id: UNKNOWN_UUID,
      type: 'credit',
      amount: 10,
      reference_id: 'GHOST',
    });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('ACCOUNT_NOT_FOUND');
  });

  it('rejects a duplicate reference_id with 409 and leaves the balance untouched', async () => {
    const account = await createTestAccount();
    const body: TransactionInput = {
      account_id: account.id,
      type: 'credit',
      amount: 25,
      reference_id: 'DUP-1',
    };

    await postTransaction(body);
    const duplicate = await postTransaction(body);

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error).toEqual({
      code: 'DUPLICATE_TRANSACTION',
      message: "A transaction with reference_id 'DUP-1' already exists for this account",
    });
    expect(await getBalance(account.id)).toBe(25_00n);
    expect(await prisma.transaction.count()).toBe(1);
  });

  it('allows the same reference_id on different accounts', async () => {
    const first = await createTestAccount('First');
    const second = await createTestAccount('Second');

    const responses = await Promise.all(
      [first, second].map((account) =>
        postTransaction({ account_id: account.id, type: 'credit', amount: 5, reference_id: 'R' }),
      ),
    );

    expect(responses.map((response) => response.status)).toEqual([201, 201]);
  });

  it('returns 400 VALIDATION_ERROR listing every invalid field', async () => {
    const response = await request(app)
      .post(TRANSACTIONS_URL)
      .send({ account_id: 'nope', type: 'refund', amount: 0, reference_id: '' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toEqual([
      'account_id',
      'type',
      'amount',
      'reference_id',
    ]);
  });
});

describe('atomicity and concurrency', () => {
  it('lets exactly 5 of 10 parallel debits of 20 succeed on a balance of 100', async () => {
    const account = await createTestAccount('Contended', 100_00n);

    const responses = await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        postTransaction({
          account_id: account.id,
          type: 'debit',
          amount: 20,
          reference_id: `PAR-${index}`,
        }),
      ),
    );
    const statuses = responses.map((response) => response.status);

    expect(statuses.filter((status) => status === 201)).toHaveLength(5);
    expect(statuses.filter((status) => status === 422)).toHaveLength(5);
    expect(await getBalance(account.id)).toBe(0n);
    expect(await prisma.transaction.count({ where: { accountId: account.id } })).toBe(5);
  });

  it('accepts only one of several parallel requests with the same reference_id', async () => {
    const account = await createTestAccount();

    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        postTransaction({
          account_id: account.id,
          type: 'credit',
          amount: 10,
          reference_id: 'RETRY-1',
        }),
      ),
    );
    const statuses = responses.map((response) => response.status).sort();

    expect(statuses).toEqual([201, 409, 409, 409, 409]);
    expect(await getBalance(account.id)).toBe(10_00n);
  });

  it('rolls back the inserted transaction when the balance update fails', async () => {
    const account = await createTestAccount('Rollback', 50_00n);
    jest
      .spyOn(accountRepository, 'incrementAccountBalance')
      .mockRejectedValueOnce(new Error('simulated crash after insert'));

    const response = await postTransaction({
      account_id: account.id,
      type: 'debit',
      amount: 20,
      reference_id: 'CRASH-1',
    });

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(await prisma.transaction.count()).toBe(0);
    expect(await getBalance(account.id)).toBe(50_00n);
  });

  it('maps a unique violation that bypasses the pre-check to 409', async () => {
    const account = await createTestAccount();
    await postTransaction({ account_id: account.id, type: 'credit', amount: 5, reference_id: 'X' });
    jest.spyOn(transactionRepository, 'findTransactionByReference').mockResolvedValueOnce(null);

    const response = await postTransaction({
      account_id: account.id,
      type: 'credit',
      amount: 5,
      reference_id: 'X',
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('DUPLICATE_TRANSACTION');
    expect(await getBalance(account.id)).toBe(5_00n);
  });

  it('keeps the database CHECK as a final guard against negative balances', async () => {
    const account = await createTestAccount('Guarded', 10_00n);

    await expect(
      prisma.$transaction((tx) =>
        accountRepository.incrementAccountBalance(account.id, -20_00n, tx),
      ),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientUnknownRequestError);
    expect(await getBalance(account.id)).toBe(10_00n);
  });
});
