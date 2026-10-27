import type { Request, Response } from 'express';

import { sendSuccess } from '@shared/utils/api-response';
import { buildPaginationMeta, parsePagination } from '@shared/utils/pagination';

import { toAccountResponse } from './account.mapper';
import type { AccountIdParams, CreateAccountBody } from './account.schema';
import * as accountService from './account.service';

const HTTP_CREATED = 201;

export async function createAccount(
  req: Request<Record<string, string>, unknown, CreateAccountBody>,
  res: Response,
): Promise<void> {
  const account = await accountService.createAccount(req.body);

  sendSuccess(res, toAccountResponse(account), { statusCode: HTTP_CREATED });
}

export async function getAccount(req: Request<AccountIdParams>, res: Response): Promise<void> {
  const account = await accountService.getAccountById(req.params.accountId);

  sendSuccess(res, toAccountResponse(account));
}

export async function listAccounts(req: Request, res: Response): Promise<void> {
  const pagination = parsePagination(req.query);
  const { accounts, totalRecords } = await accountService.listAccounts(pagination);

  sendSuccess(res, accounts.map(toAccountResponse), {
    meta: buildPaginationMeta(pagination, totalRecords),
  });
}
