import { prisma } from '@db/prisma';
import { AppError } from '@shared/errors/app-error';
import { ErrorCode } from '@shared/errors/error-codes';

export interface HealthStatus {
  status: 'ok';
  database: 'up';
  uptimeSeconds: number;
  timestamp: string;
}

async function assertDatabaseIsReachable(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    throw new AppError(ErrorCode.SERVICE_UNAVAILABLE, 'Database is unavailable');
  }
}

export async function getHealthStatus(): Promise<HealthStatus> {
  await assertDatabaseIsReachable();

  return {
    status: 'ok',
    database: 'up',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}
