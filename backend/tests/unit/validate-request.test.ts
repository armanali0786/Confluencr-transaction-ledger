import { Router } from 'express';
import request from 'supertest';
import { z } from 'zod';

import { validateRequest } from '@shared/middlewares/validate-request';

import { buildTestApp } from '../helpers/build-test-app';

const router = Router();

router.post(
  '/items/:itemId',
  validateRequest({
    params: z.object({ itemId: z.uuid({ error: 'itemId must be a valid UUID' }) }),
    query: z.object({ page: z.coerce.number().int().positive().default(1) }),
    body: z.object({ name: z.string().trim().min(1, 'Name is required') }),
  }),
  (req, res) => {
    res.json({ params: req.params, query: req.query, body: req.body });
  },
);

const app = buildTestApp(router);
const VALID_ID = '3f8a1c2e-4b5d-4e6f-8a9b-0c1d2e3f4a5b';

describe('validateRequest', () => {
  it('passes parsed values to the handler', async () => {
    const response = await request(app)
      .post(`/items/${VALID_ID}?page=3`)
      .send({ name: '  Savings  ' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      params: { itemId: VALID_ID },
      query: { page: 3 },
      body: { name: 'Savings' },
    });
  });

  it('applies schema defaults', async () => {
    const response = await request(app).post(`/items/${VALID_ID}`).send({ name: 'Savings' });

    expect(response.body.query).toEqual({ page: 1 });
  });

  it('collects errors from params, query and body into one envelope', async () => {
    const response = await request(app).post('/items/not-a-uuid?page=-1').send({ name: '   ' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          { field: 'itemId', message: 'itemId must be a valid UUID' },
          { field: 'page', message: expect.any(String) },
          { field: 'name', message: 'Name is required' },
        ],
      },
    });
  });
});
