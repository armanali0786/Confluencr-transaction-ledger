import request from 'supertest';

import { createApp } from '../../src/app';
import { prisma } from '@db/prisma';
import * as accountRepository from '@modules/account/account.repository';
import * as transactionRepository from '@modules/transaction/transaction.repository';

import { resetDatabase } from '../helpers/database';
import { createTestAccount, UNKNOWN_UUID } from '../helpers/fixtures';
import { expectLedgerToReconcile } from '../helpers/ledger';

const app = createApp();
const TRANSFERS_URL = '/api/v1/transfers';

interface TransferInput {
  from_account_id: string;
  to_account_id: string;
  amount: number | string;
  reference_id: string;
  description?: string;
}

function postTransfer(body: TransferInput) {
  return request(app).post(TRANSFERS_URL).send(body);
}

async function getBalance(accountId: string): Promise<bigint> {
  const account = await prisma.account.findUniqueOrThrow({ where: { id: accountId } });
  return account.balance;
}

async function createAccountPair(fromBalance: bigint, toBalance: bigint) {
  const from = await createTestAccount('A', fromBalance);
  const to = await createTestAccount('B', toBalance);
  return { from, to };
}

beforeEach(async () => {
  await resetDatabase();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await expectLedgerToReconcile();
});

afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe('POST /api/v1/transfers', () => {
  it('runs the assessment example: A=100, B=50, transfer 30 → A=70, B=80', async () => {
    const { from, to } = await createAccountPair(100_00n, 50_00n);

    const response = await postTransfer({
      from_account_id: from.id,
      to_account_id: to.id,
      amount: 30,
      reference_id: 'TRF-001',
      description: 'Rent share',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.accounts.from.balance).toBe('70.00');
    expect(response.body.data.accounts.to.balance).toBe('80.00');
    expect(await getBalance(from.id)).toBe(70_00n);
    expect(await getBalance(to.id)).toBe(80_00n);
  });

  it('returns the transfer, both linked ledger entries and the new balances', async () => {
    const { from, to } = await createAccountPair(100_00n, 0n);

    const response = await postTransfer({
      from_account_id: from.id,
      to_account_id: to.id,
      amount: '12.34',
      reference_id: 'TRF-SHAPE',
      description: 'Split bill',
    });
    const { transfer, transactions, accounts } = response.body.data;

    expect(transfer).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      from_account_id: from.id,
      to_account_id: to.id,
      amount: '12.34',
      description: 'Split bill',
      reference_id: 'TRF-SHAPE',
      created_at: expect.any(String),
    });
    expect(transactions.debit).toMatchObject({
      account_id: from.id,
      type: 'debit',
      amount: '12.34',
      reference_id: 'TRF-SHAPE',
      transfer_id: transfer.id,
    });
    expect(transactions.credit).toMatchObject({
      account_id: to.id,
      type: 'credit',
      amount: '12.34',
      reference_id: 'TRF-SHAPE',
      transfer_id: transfer.id,
    });
    expect(accounts.from).toMatchObject({ id: from.id, balance: '87.66' });
    expect(accounts.to).toMatchObject({ id: to.id, balance: '12.34' });
    expect(await prisma.transaction.count({ where: { transferId: transfer.id } })).toBe(2);
  });

  it('shows transfer entries in both account histories', async () => {
    const { from, to } = await createAccountPair(100_00n, 0n);
    await postTransfer({
      from_account_id: from.id,
      to_account_id: to.id,
      amount: 5,
      reference_id: 'TRF-HIST',
    });

    const [fromHistory, toHistory] = await Promise.all([
      request(app).get(`/api/v1/accounts/${from.id}/transactions`),
      request(app).get(`/api/v1/accounts/${to.id}/transactions`),
    ]);

    expect(fromHistory.body.data[0]).toMatchObject({ type: 'debit', reference_id: 'TRF-HIST' });
    expect(toHistory.body.data[0]).toMatchObject({ type: 'credit', reference_id: 'TRF-HIST' });
  });

  it('allows transferring the entire balance', async () => {
    const { from, to } = await createAccountPair(40_00n, 0n);

    const response = await postTransfer({
      from_account_id: from.id,
      to_account_id: to.id,
      amount: 40,
      reference_id: 'TRF-ALL',
    });

    expect(response.status).toBe(201);
    expect(await getBalance(from.id)).toBe(0n);
  });

  it('rejects a transfer to the same account with 400 SAME_ACCOUNT_TRANSFER', async () => {
    const account = await createTestAccount('Solo', 100_00n);

    const response = await postTransfer({
      from_account_id: account.id,
      to_account_id: account.id.toUpperCase(),
      amount: 10,
      reference_id: 'TRF-SELF',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual({
      code: 'SAME_ACCOUNT_TRANSFER',
      message: 'from_account_id and to_account_id must be different accounts',
    });
    expect(await prisma.transfer.count()).toBe(0);
  });

  it.each([
    ['source', 'from_account_id'],
    ['destination', 'to_account_id'],
  ] as const)('returns 404 when the %s account does not exist', async (_label, field) => {
    const account = await createTestAccount('Real', 100_00n);
    const body: TransferInput = {
      from_account_id: account.id,
      to_account_id: account.id,
      amount: 10,
      reference_id: 'TRF-404',
    };
    body[field] = UNKNOWN_UUID;

    const response = await postTransfer(body);

    expect(response.status).toBe(404);
    expect(response.body.error).toEqual({
      code: 'ACCOUNT_NOT_FOUND',
      message: `Account ${UNKNOWN_UUID} not found`,
    });
    expect(await getBalance(account.id)).toBe(100_00n);
  });

  it('rejects a transfer above the source balance with 422 and changes nothing', async () => {
    const { from, to } = await createAccountPair(20_00n, 0n);

    const response = await postTransfer({
      from_account_id: from.id,
      to_account_id: to.id,
      amount: 20.01,
      reference_id: 'TRF-BIG',
    });

    expect(response.status).toBe(422);
    expect(response.body.error).toEqual({
      code: 'INSUFFICIENT_BALANCE',
      message: 'Insufficient balance for this transfer',
    });
    expect(await getBalance(from.id)).toBe(20_00n);
    expect(await getBalance(to.id)).toBe(0n);
    expect(await prisma.transfer.count()).toBe(0);
  });

  it('rejects a reused transfer reference_id with 409', async () => {
    const { from, to } = await createAccountPair(100_00n, 0n);
    const body: TransferInput = {
      from_account_id: from.id,
      to_account_id: to.id,
      amount: 10,
      reference_id: 'TRF-DUP',
    };

    await postTransfer(body);
    const duplicate = await postTransfer(body);

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error).toEqual({
      code: 'DUPLICATE_TRANSACTION',
      message: "A transfer or transaction with reference_id 'TRF-DUP' already exists",
    });
    expect(await getBalance(from.id)).toBe(90_00n);
  });

  it('rejects a reference_id already used by a transaction on either account', async () => {
    const { from, to } = await createAccountPair(100_00n, 0n);
    await request(app)
      .post('/api/v1/transactions')
      .send({ account_id: to.id, type: 'credit', amount: 1, reference_id: 'INV-7' });

    const response = await postTransfer({
      from_account_id: from.id,
      to_account_id: to.id,
      amount: 10,
      reference_id: 'INV-7',
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('DUPLICATE_TRANSACTION');
    expect(await prisma.transfer.count()).toBe(0);
  });

  it('returns 400 VALIDATION_ERROR listing every invalid field', async () => {
    const response = await request(app)
      .post(TRANSFERS_URL)
      .send({ from_account_id: 'x', to_account_id: 'y', amount: -1, reference_id: '' });

    expect(response.status).toBe(400);
    expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toEqual([
      'from_account_id',
      'to_account_id',
      'amount',
      'reference_id',
    ]);
  });
});

describe('atomicity and concurrency', () => {
  it('leaves both balances unchanged when the credit fails after the debit', async () => {
    const { from, to } = await createAccountPair(100_00n, 50_00n);
    const insertTransaction = transactionRepository.insertTransaction;
    jest.spyOn(transactionRepository, 'insertTransaction').mockImplementation(async (entry, db) => {
      if (entry.type === 'credit') throw new Error('simulated crash between debit and credit');
      return insertTransaction(entry, db);
    });

    const response = await postTransfer({
      from_account_id: from.id,
      to_account_id: to.id,
      amount: 30,
      reference_id: 'TRF-CRASH',
    });

    expect(response.status).toBe(500);
    expect(await getBalance(from.id)).toBe(100_00n);
    expect(await getBalance(to.id)).toBe(50_00n);
    expect(await prisma.transfer.count()).toBe(0);
    expect(await prisma.transaction.count({ where: { referenceId: 'TRF-CRASH' } })).toBe(0);
  });

  it('leaves both balances unchanged when the final balance update fails', async () => {
    const { from, to } = await createAccountPair(100_00n, 50_00n);
    const incrementAccountBalance = accountRepository.incrementAccountBalance;
    jest
      .spyOn(accountRepository, 'incrementAccountBalance')
      .mockImplementation(async (id, delta, db) => {
        if (id === to.id) throw new Error('simulated crash on destination update');
        return incrementAccountBalance(id, delta, db);
      });

    const response = await postTransfer({
      from_account_id: from.id,
      to_account_id: to.id,
      amount: 30,
      reference_id: 'TRF-CRASH-2',
    });

    expect(response.status).toBe(500);
    expect(await getBalance(from.id)).toBe(100_00n);
    expect(await getBalance(to.id)).toBe(50_00n);
  });

  it('completes concurrent opposite-direction transfers without deadlock', async () => {
    const { from: a, to: b } = await createAccountPair(1_000_00n, 1_000_00n);
    const transfers = Array.from({ length: 20 }, (_, index) => {
      const forward = index % 2 === 0;
      return postTransfer({
        from_account_id: forward ? a.id : b.id,
        to_account_id: forward ? b.id : a.id,
        amount: forward ? 10 : 7,
        reference_id: `TRF-X-${index}`,
      });
    });

    const responses = await Promise.all(transfers);

    expect(responses.map((response) => response.status)).toEqual(Array(20).fill(201));
    // 10 transfers of 10.00 A→B and 10 of 7.00 B→A.
    expect(await getBalance(a.id)).toBe(1_000_00n - 100_00n + 70_00n);
    expect(await getBalance(b.id)).toBe(1_000_00n + 100_00n - 70_00n);
  });

  it('never overdraws the source under concurrent transfers', async () => {
    const { from, to } = await createAccountPair(50_00n, 0n);

    const responses = await Promise.all(
      Array.from({ length: 8 }, (_, index) =>
        postTransfer({
          from_account_id: from.id,
          to_account_id: to.id,
          amount: 10,
          reference_id: `TRF-RACE-${index}`,
        }),
      ),
    );
    const statuses = responses.map((response) => response.status);

    expect(statuses.filter((status) => status === 201)).toHaveLength(5);
    expect(statuses.filter((status) => status === 422)).toHaveLength(3);
    expect(await getBalance(from.id)).toBe(0n);
    expect(await getBalance(to.id)).toBe(50_00n);
  });

  it('accepts only one of several parallel transfers with the same reference_id', async () => {
    const { from, to } = await createAccountPair(100_00n, 0n);

    const responses = await Promise.all(
      Array.from({ length: 4 }, () =>
        postTransfer({
          from_account_id: from.id,
          to_account_id: to.id,
          amount: 10,
          reference_id: 'TRF-ONCE',
        }),
      ),
    );

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409, 409, 409]);
    expect(await getBalance(from.id)).toBe(90_00n);
  });
});

describe('405 METHOD_NOT_ALLOWED', () => {
  it.each(['get', 'put', 'delete'] as const)('rejects %s /api/v1/transfers', async (method) => {
    const response = await request(app)[method](TRANSFERS_URL);

    expect(response.status).toBe(405);
    expect(response.headers.allow).toBe('POST');
  });
});
