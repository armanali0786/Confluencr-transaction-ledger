import type { Account } from '@prisma/client';

import { AppError } from '@shared/errors/app-error';
import { ErrorCode } from '@shared/errors/error-codes';
import type { Pagination } from '@shared/utils/pagination';

import * as accountRepository from './account.repository';
import type { CreateAccountBody } from './account.schema';

interface AccountPage {
  accounts: Account[];
  totalRecords: number;
}

export function createAccount({ name }: CreateAccountBody): Promise<Account> {
  return accountRepository.insertAccount(name);
}

export async function getAccountById(accountId: string): Promise<Account> {
  const account = await accountRepository.findAccountById(accountId);

  if (!account) {
    throw new AppError(ErrorCode.ACCOUNT_NOT_FOUND, `Account ${accountId} not found`);
  }

  return account;
}

export async function listAccounts({ skip, limit }: Pagination): Promise<AccountPage> {
  const [accounts, totalRecords] = await Promise.all([
    accountRepository.findAccounts({ skip, take: limit }),
    accountRepository.countAccounts(),
  ]);

  return { accounts, totalRecords };
}
