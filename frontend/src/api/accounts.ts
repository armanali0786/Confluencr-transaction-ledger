import type { Account, CreateAccountInput, Page, PageParams } from '@/types/api';

import { getData, postData } from './client';
import { toPage } from './pagination';

export async function fetchAccounts(params: PageParams): Promise<Page<Account>> {
  return toPage(await getData<Account[]>('/accounts', params));
}

export async function fetchAccount(accountId: string): Promise<Account> {
  return (await getData<Account>(`/accounts/${accountId}`)).data;
}

export function createAccount(input: CreateAccountInput): Promise<Account> {
  return postData<Account>('/accounts', input);
}
