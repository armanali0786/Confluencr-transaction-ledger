import request from 'supertest';

import { createApp } from '../../src/app';
import { openApiDocument } from '../../src/docs/swagger';
import { prisma } from '@db/prisma';

const app = createApp();

const DOCUMENTED_OPERATIONS = [
  'GET /health',
  'POST /accounts',
  'GET /accounts',
  'GET /accounts/{accountId}',
  'GET /accounts/{accountId}/transactions',
  'POST /transactions',
  'GET /transactions/{transactionId}',
  'POST /transfers',
];

afterAll(async () => {
  await prisma.$disconnect();
});

describe('API documentation', () => {
  it('serves Swagger UI at /api/docs', async () => {
    const response = await request(app).get('/api/docs/');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.text).toContain('swagger-ui');
  });

  it('serves the raw OpenAPI document as JSON', async () => {
    const response = await request(app).get('/api/docs/openapi.json');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ openapi: '3.0.3', info: { title: 'Ledger API' } });
  });

  it('documents every API operation', () => {
    const paths = openApiDocument.paths as Record<string, Record<string, unknown>>;
    const operations = Object.entries(paths).flatMap(([path, methods]) =>
      Object.keys(methods).map((method) => `${method.toUpperCase()} ${path}`),
    );

    expect(operations.sort()).toEqual([...DOCUMENTED_OPERATIONS].sort());
  });
});
