import { type Prisma, PrismaClient } from '@prisma/client';

import { env } from '@config/env';

// Errors are surfaced by the error handler; Prisma's own logging would only duplicate them in tests.
const LOG_LEVELS: Record<typeof env.NODE_ENV, Prisma.LogLevel[]> = {
  development: ['warn', 'error'],
  production: ['error'],
  test: [],
};

export const prisma = new PrismaClient({ log: LOG_LEVELS[env.NODE_ENV] });
