import type { Request, Response } from 'express';

import { sendSuccess } from '@shared/utils/api-response';

import { toCompletedTransferResponse } from './transfer.mapper';
import type { CreateTransferBody } from './transfer.schema';
import * as transferService from './transfer.service';

const HTTP_CREATED = 201;

export async function createTransfer(
  req: Request<Record<string, string>, unknown, CreateTransferBody>,
  res: Response,
): Promise<void> {
  const result = await transferService.createTransfer(req.body);

  sendSuccess(res, toCompletedTransferResponse(result), { statusCode: HTTP_CREATED });
}
