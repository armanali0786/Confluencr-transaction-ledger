import request from 'supertest';

import { createApp } from '../../src/app';
import { prisma } from '@db/prisma';

import { resetDatabase } from '../helpers/database';
import { createTestAccount, UNKNOWN_UUID } from '../helpers/fixtures';

const app = createApp();
const ACCOUNTS_URL = '/api/v1/accounts';

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe('POST /api/v1/accounts', () => {
  it('creates an account with a zero balance', async () => {
    const response = await request(app).post(ACCOUNTS_URL).send({ name: '  Alice Savings  ' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      data: {
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        name: 'Alice Savings',
        balance: '0.00',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    });
    expect(await prisma.account.count()).toBe(1);
  });

  it('rejects a missing name', async () => {
    const response = await request(app).post(ACCOUNTS_URL).send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: [{ field: 'name', message: 'name is required and must be a string' }],
    });
  });

  it.each([
    ['blank', '   '],
    ['too long', 'a'.repeat(101)],
    ['not a string', 42],
  ])('rejects a %s name', async (_label, name) => {
    const response = await request(app).post(ACCOUNTS_URL).send({ name });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details[0].field).toBe('name');
  });

  it('accepts a name of exactly 100 characters', async () => {
    const response = await request(app)
      .post(ACCOUNTS_URL)
      .send({ name: 'a'.repeat(100) });

    expect(response.status).toBe(201);
  });

  it('rejects an attempt to set the opening balance', async () => {
    const response = await request(app).post(ACCOUNTS_URL).send({ name: 'Rich', balance: 1000 });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([
      { field: 'balance', message: 'Unknown field is not allowed' },
    ]);
    expect(await prisma.account.count()).toBe(0);
  });
});

describe('GET /api/v1/accounts/:accountId', () => {
  it('returns the account with its current balance', async () => {
    const account = await createTestAccount('Bob', 380_00n);

    const response = await request(app).get(`${ACCOUNTS_URL}/${account.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: account.id, name: 'Bob', balance: '380.00' });
  });

  it('returns 404 ACCOUNT_NOT_FOUND for an unknown UUID', async () => {
    const response = await request(app).get(`${ACCOUNTS_URL}/${UNKNOWN_UUID}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toEqual({
      code: 'ACCOUNT_NOT_FOUND',
      message: `Account ${UNKNOWN_UUID} not found`,
    });
  });

  it('returns 400 VALIDATION_ERROR for a malformed id', async () => {
    const response = await request(app).get(`${ACCOUNTS_URL}/not-a-uuid`);

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: [{ field: 'accountId', message: 'accountId must be a valid UUID' }],
    });
  });
});

describe('GET /api/v1/accounts', () => {
  it('returns an empty page when there are no accounts', async () => {
    const response = await request(app).get(ACCOUNTS_URL);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: [],
      meta: { current_page: 1, page_size: 10, total_records: 0, total_pages: 0 },
    });
  });

  it('paginates accounts newest first', async () => {
    for (const name of ['First', 'Second', 'Third']) {
      await createTestAccount(name);
    }

    const firstPage = await request(app).get(`${ACCOUNTS_URL}?page=1&limit=2`);
    const secondPage = await request(app).get(`${ACCOUNTS_URL}?page=2&limit=2`);

    expect(firstPage.body.data.map((a: { name: string }) => a.name)).toEqual(['Third', 'Second']);
    expect(firstPage.body.meta).toEqual({
      current_page: 1,
      page_size: 2,
      total_records: 3,
      total_pages: 2,
    });
    expect(secondPage.body.data.map((a: { name: string }) => a.name)).toEqual(['First']);
  });

  it('returns 400 INVALID_PAGINATION for bad parameters', async () => {
    const response = await request(app).get(`${ACCOUNTS_URL}?page=0&limit=500`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_PAGINATION');
    expect(response.body.error.details).toHaveLength(2);
  });
});
