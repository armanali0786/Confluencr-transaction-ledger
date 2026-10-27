import request from 'supertest';

import { createApp } from '../../src/app';
import { prisma } from '@db/prisma';

import { resetDatabase } from '../helpers/database';
import { createTestAccount, createTestTransaction, UNKNOWN_UUID } from '../helpers/fixtures';

const app = createApp();
const BASE_TIME = new Date('2026-01-01T00:00:00.000Z').getTime();
const MINUTE_MS = 60_000;

function listUrl(accountId: string, query = ''): string {
  return `/api/v1/accounts/${accountId}/transactions${query}`;
}

function referenceIds(body: { data: Array<{ reference_id: string }> }): string[] {
  return body.data.map((transaction) => transaction.reference_id);
}

/** Creates `count` transactions one minute apart: TX-1 is the oldest, TX-<count> the newest. */
async function seedHistory(accountId: string, count: number): Promise<void> {
  for (let index = 1; index <= count; index += 1) {
    await createTestTransaction(accountId, {
      referenceId: `TX-${index}`,
      createdAt: new Date(BASE_TIME + index * MINUTE_MS),
    });
  }
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe('GET /api/v1/accounts/:accountId/transactions', () => {
  it('returns transactions latest first with default pagination', async () => {
    const account = await createTestAccount();
    await seedHistory(account.id, 4);

    const response = await request(app).get(listUrl(account.id));

    expect(response.status).toBe(200);
    expect(referenceIds(response.body)).toEqual(['TX-4', 'TX-3', 'TX-2', 'TX-1']);
    expect(response.body.meta).toEqual({
      current_page: 1,
      page_size: 10,
      total_records: 4,
      total_pages: 1,
    });
    expect(response.body.data[0]).toEqual({
      id: expect.any(String),
      account_id: account.id,
      type: 'credit',
      amount: '10.00',
      description: null,
      reference_id: 'TX-4',
      transfer_id: null,
      created_at: new Date(BASE_TIME + 4 * MINUTE_MS).toISOString(),
    });
  });

  it('breaks created_at ties by id descending', async () => {
    const account = await createTestAccount();
    const sameInstant = new Date(BASE_TIME);
    const created = await Promise.all(
      ['A', 'B', 'C'].map((referenceId) =>
        createTestTransaction(account.id, { referenceId, createdAt: sameInstant }),
      ),
    );
    const expectedIds = created
      .map((transaction) => transaction.id)
      .sort()
      .reverse();

    const response = await request(app).get(listUrl(account.id));

    expect(response.body.data.map((transaction: { id: string }) => transaction.id)).toEqual(
      expectedIds,
    );
  });

  it('splits history across pages without gaps or overlaps', async () => {
    const account = await createTestAccount();
    await seedHistory(account.id, 5);

    const pages = await Promise.all(
      [1, 2, 3].map((page) => request(app).get(listUrl(account.id, `?page=${page}&limit=2`))),
    );

    expect(pages.map((page) => referenceIds(page.body))).toEqual([
      ['TX-5', 'TX-4'],
      ['TX-3', 'TX-2'],
      ['TX-1'],
    ]);
    expect(pages.map((page) => page.body.meta)).toEqual(
      [1, 2, 3].map((page) => ({
        current_page: page,
        page_size: 2,
        total_records: 5,
        total_pages: 3,
      })),
    );
  });

  it('returns an empty page beyond the last page', async () => {
    const account = await createTestAccount();
    await seedHistory(account.id, 3);

    const response = await request(app).get(listUrl(account.id, '?page=5&limit=2'));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.meta).toEqual({
      current_page: 5,
      page_size: 2,
      total_records: 3,
      total_pages: 2,
    });
  });

  it('returns an empty list for an account without transactions', async () => {
    const account = await createTestAccount();

    const response = await request(app).get(listUrl(account.id));

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.meta.total_pages).toBe(0);
  });

  it('only returns transactions of the requested account', async () => {
    const mine = await createTestAccount('Mine');
    const other = await createTestAccount('Other');
    await createTestTransaction(mine.id, { referenceId: 'MINE' });
    await createTestTransaction(other.id, { referenceId: 'OTHER' });

    const response = await request(app).get(listUrl(mine.id));

    expect(referenceIds(response.body)).toEqual(['MINE']);
    expect(response.body.meta.total_records).toBe(1);
  });

  it('returns 404 ACCOUNT_NOT_FOUND for an unknown account', async () => {
    const response = await request(app).get(listUrl(UNKNOWN_UUID));

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('ACCOUNT_NOT_FOUND');
  });

  it('returns 400 VALIDATION_ERROR for a malformed account id', async () => {
    const response = await request(app).get(listUrl('not-a-uuid'));

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([
      { field: 'accountId', message: 'accountId must be a valid UUID' },
    ]);
  });

  it.each(['?page=0', '?page=-2', '?page=1.5', '?page=abc', '?limit=0', '?limit=101', '?limit=x'])(
    'returns 400 INVALID_PAGINATION for %s',
    async (query) => {
      const account = await createTestAccount();

      const response = await request(app).get(listUrl(account.id, query));

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual({
        code: 'INVALID_PAGINATION',
        message: 'Invalid pagination parameters',
        details: [{ field: expect.stringMatching(/^(page|limit)$/), message: expect.any(String) }],
      });
    },
  );

  it('accepts the maximum limit of 100', async () => {
    const account = await createTestAccount();

    const response = await request(app).get(listUrl(account.id, '?limit=100'));

    expect(response.status).toBe(200);
    expect(response.body.meta.page_size).toBe(100);
  });
});

describe('GET /api/v1/transactions/:transactionId', () => {
  it('returns a single transaction', async () => {
    const account = await createTestAccount();
    const transaction = await createTestTransaction(account.id, {
      referenceId: 'SINGLE',
      description: 'One-off',
    });

    const response = await request(app).get(`/api/v1/transactions/${transaction.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: transaction.id,
      account_id: account.id,
      reference_id: 'SINGLE',
      description: 'One-off',
      amount: '10.00',
    });
  });

  it('returns 404 TRANSACTION_NOT_FOUND for an unknown id', async () => {
    const response = await request(app).get(`/api/v1/transactions/${UNKNOWN_UUID}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toEqual({
      code: 'TRANSACTION_NOT_FOUND',
      message: `Transaction ${UNKNOWN_UUID} not found`,
    });
  });

  it('returns 400 VALIDATION_ERROR for a malformed id', async () => {
    const response = await request(app).get('/api/v1/transactions/123');

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([
      { field: 'transactionId', message: 'transactionId must be a valid UUID' },
    ]);
  });
});
