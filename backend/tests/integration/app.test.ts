import { Router } from 'express';
import request from 'supertest';

import { createApp } from '../../src/app';
import { prisma } from '@db/prisma';
import { AppError } from '@shared/errors/app-error';
import { ErrorCode } from '@shared/errors/error-codes';
import { asyncHandler } from '@shared/utils/async-handler';

import { buildTestApp } from '../helpers/build-test-app';

const app = createApp();

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/v1/health', () => {
  it('reports the app and database as healthy', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        status: 'ok',
        database: 'up',
        uptime_seconds: expect.any(Number),
        timestamp: expect.any(String),
      },
    });
  });

  it('returns 503 when the database is unreachable', async () => {
    const querySpy = jest.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('down'));

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE');
    querySpy.mockRestore();
  });
});

describe('error envelope', () => {
  it('returns 400 INVALID_REQUEST_BODY for malformed JSON', async () => {
    const response = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{"name": "broken",');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: { code: 'INVALID_REQUEST_BODY', message: 'Request body contains malformed JSON' },
    });
  });

  it('returns 413 PAYLOAD_TOO_LARGE for an oversized body', async () => {
    const response = await request(app)
      .post('/api/v1/health')
      .send({ description: 'x'.repeat(200 * 1024) });

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('returns 404 ROUTE_NOT_FOUND for an unknown route', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: { code: 'ROUTE_NOT_FOUND', message: 'Route GET /api/v1/does-not-exist not found' },
    });
  });

  it('returns the status and code of a thrown AppError', async () => {
    const router = Router();
    router.get(
      '/boom',
      asyncHandler(async () => {
        throw new AppError(ErrorCode.INSUFFICIENT_BALANCE, 'Insufficient balance');
      }),
    );

    const response = await request(buildTestApp(router)).get('/boom');

    expect(response.status).toBe(422);
    expect(response.body).toEqual({
      success: false,
      error: { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' },
    });
  });

  it('hides internal error details behind a generic 500', async () => {
    const router = Router();
    router.get(
      '/crash',
      asyncHandler(async () => {
        throw new Error('connection string leaked');
      }),
    );

    const response = await request(buildTestApp(router)).get('/crash');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' },
    });
  });
});

describe('request id and security headers', () => {
  it('generates a request id when none is sent', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('echoes a well-formed incoming request id', async () => {
    const response = await request(app).get('/api/v1/health').set('X-Request-Id', 'trace-123');

    expect(response.headers['x-request-id']).toBe('trace-123');
  });

  it('replaces a malformed incoming request id', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .set('X-Request-Id', 'bad id with spaces');

    expect(response.headers['x-request-id']).not.toBe('bad id with spaces');
  });

  it('sets helmet security headers and hides x-powered-by', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
