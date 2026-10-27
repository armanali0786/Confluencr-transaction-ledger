import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

import { AppError } from './app-error';
import { ErrorCode } from './error-codes';
import { formatZodError } from './format-zod-error';

interface BodyParserError extends Error {
  type: string;
}

const PRISMA_UNIQUE_VIOLATION = 'P2002';
const PRISMA_RECORD_NOT_FOUND = 'P2025';

function isBodyParserError(error: unknown): error is BodyParserError {
  return error instanceof Error && typeof (error as Partial<BodyParserError>).type === 'string';
}

function fromBodyParserError(error: BodyParserError): AppError | undefined {
  if (error.type === 'entity.parse.failed') {
    return new AppError(ErrorCode.INVALID_REQUEST_BODY, 'Request body contains malformed JSON');
  }
  if (error.type === 'entity.too.large') {
    return new AppError(ErrorCode.PAYLOAD_TOO_LARGE, 'Request body is too large');
  }
  return undefined;
}

function fromPrismaKnownError(error: Prisma.PrismaClientKnownRequestError): AppError | undefined {
  if (error.code === PRISMA_UNIQUE_VIOLATION) {
    return new AppError(ErrorCode.CONFLICT, 'Resource already exists');
  }
  if (error.code === PRISMA_RECORD_NOT_FOUND) {
    return new AppError(ErrorCode.RESOURCE_NOT_FOUND, 'Resource not found');
  }
  return undefined;
}

/** Normalises any thrown value into an AppError; unknown errors become a generic 500. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof ZodError) {
    return new AppError(
      ErrorCode.VALIDATION_ERROR,
      'Request validation failed',
      formatZodError(error),
    );
  }

  const mapped =
    (isBodyParserError(error) && fromBodyParserError(error)) ||
    (error instanceof Prisma.PrismaClientKnownRequestError && fromPrismaKnownError(error)) ||
    (error instanceof Prisma.PrismaClientInitializationError &&
      new AppError(ErrorCode.SERVICE_UNAVAILABLE, 'Database is unavailable'));

  return mapped || new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 'An unexpected error occurred');
}
