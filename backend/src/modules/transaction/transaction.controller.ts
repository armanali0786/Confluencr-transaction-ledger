import type { Request, Response } from 'express';

import { toAccountResponse } from '@modules/account/account.mapper';
import { sendSuccess } from '@shared/utils/api-response';

import { toTransactionResponse } from './transaction.mapper';
import type { CreateTransactionBody } from './transaction.schema';
import * as transactionService from './transaction.service';

const HTTP_CREATED = 201;

export async function createTransaction(
  req: Request<Record<string, string>, unknown, CreateTransactionBody>,
  res: Response,
): Promise<void> {
  const { transaction, account } = await transactionService.createTransaction(req.body);

  sendSuccess(
    res,
    { transaction: toTransactionResponse(transaction), account: toAccountResponse(account) },
    { statusCode: HTTP_CREATED },
  );
}
