import type { PageParams } from '@/types/api';

/**
 * Everything balance-related lives under ['accounts'], so a single invalidation after
 * any money movement refreshes lists, details and transaction histories together.
 */
export const queryKeys = {
  accounts: ['accounts'] as const,
  accountList: (params: PageParams) => ['accounts', 'list', params] as const,
  accountDetail: (accountId: string) => ['accounts', 'detail', accountId] as const,
  accountTransactions: (accountId: string, params: PageParams) =>
    ['accounts', 'detail', accountId, 'transactions', params] as const,
};
