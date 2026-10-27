import type { Request, Response } from 'express';

import { sendSuccess } from '@shared/utils/api-response';

import { getHealthStatus } from './health.service';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const health = await getHealthStatus();

  sendSuccess(res, {
    status: health.status,
    database: health.database,
    uptime_seconds: health.uptimeSeconds,
    timestamp: health.timestamp,
  });
}
