import type { Request, Response } from 'express';

import { toAccountResponse } from '@modules/account/account.mapper';
import type { AccountIdParams } from '@modules/account/account.schema';
import { sendSuccess } from '@shared/utils/api-response';
import { buildPaginationMeta, parsePagination } from '@shared/utils/pagination';

import { toTransactionResponse } from './transaction.mapper';
import type { CreateTransactionBody, TransactionIdParams } from './transaction.schema';
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

export async function getTransaction(
  req: Request<TransactionIdParams>,
  res: Response,
): Promise<void> {
  const transaction = await transactionService.getTransactionById(req.params.transactionId);

  sendSuccess(res, toTransactionResponse(transaction));
}

export async function listAccountTransactions(
  req: Request<AccountIdParams>,
  res: Response,
): Promise<void> {
  const pagination = parsePagination(req.query);
  const { transactions, totalRecords } = await transactionService.listAccountTransactions(
    req.params.accountId,
    pagination,
  );

  sendSuccess(res, transactions.map(toTransactionResponse), {
    meta: buildPaginationMeta(pagination, totalRecords),
  });
}
