import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { AppError } from '@shared/errors/app-error';
import { ErrorCode } from '@shared/errors/error-codes';
import { toAppError } from '@shared/errors/to-app-error';

function buildPrismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('prisma failure', {
    code,
    clientVersion: 'test',
  });
}

function buildBodyParserError(type: string): Error {
  return Object.assign(new Error('body parser failure'), { type });
}

describe('toAppError', () => {
  it('returns an AppError unchanged', () => {
    const error = new AppError(ErrorCode.ACCOUNT_NOT_FOUND, 'Account not found');

    expect(toAppError(error)).toBe(error);
  });

  it('maps a ZodError to VALIDATION_ERROR with field details', () => {
    const result = z.object({ amount: z.number().positive() }).safeParse({ amount: -1 });
    if (result.success) throw new Error('expected validation to fail');

    const error = toAppError(result.error);

    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual([{ field: 'amount', message: expect.any(String) }]);
  });

  it('maps malformed JSON to INVALID_REQUEST_BODY', () => {
    const error = toAppError(buildBodyParserError('entity.parse.failed'));

    expect(error.code).toBe(ErrorCode.INVALID_REQUEST_BODY);
    expect(error.statusCode).toBe(400);
  });

  it('maps an oversized body to PAYLOAD_TOO_LARGE', () => {
    expect(toAppError(buildBodyParserError('entity.too.large')).statusCode).toBe(413);
  });

  it('maps a Prisma unique violation to CONFLICT', () => {
    const error = toAppError(buildPrismaError('P2002'));

    expect(error.code).toBe(ErrorCode.CONFLICT);
    expect(error.statusCode).toBe(409);
  });

  it('maps a Prisma record-not-found to RESOURCE_NOT_FOUND', () => {
    expect(toAppError(buildPrismaError('P2025')).code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
  });

  it('maps a Prisma connection failure to SERVICE_UNAVAILABLE', () => {
    const error = toAppError(new Prisma.PrismaClientInitializationError('cannot connect', 'test'));

    expect(error.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    expect(error.statusCode).toBe(503);
  });

  it.each([
    ['an unknown Prisma error', buildPrismaError('P9999')],
    ['an unknown body parser error', buildBodyParserError('encoding.unsupported')],
    ['a plain Error', new Error('database password is hunter2')],
    ['a non-error value', 'boom'],
  ])('hides %s behind a generic 500', (_label, thrown) => {
    const error = toAppError(thrown);

    expect(error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('An unexpected error occurred');
  });
});
