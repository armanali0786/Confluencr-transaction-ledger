import type {
  CreatedTransaction,
  CreateTransactionInput,
  Page,
  PageParams,
  Transaction,
} from '@/types/api';

import { getData, postData } from './client';
import { toPage } from './pagination';

export async function fetchAccountTransactions(
  accountId: string,
  params: PageParams,
): Promise<Page<Transaction>> {
  return toPage(await getData<Transaction[]>(`/accounts/${accountId}/transactions`, params));
}

export function createTransaction(input: CreateTransactionInput): Promise<CreatedTransaction> {
  return postData<CreatedTransaction>('/transactions', input);
}
