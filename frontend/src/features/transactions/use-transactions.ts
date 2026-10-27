import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createTransaction, fetchAccountTransactions } from '@/api/transactions';
import { formatMoney } from '@/lib/format';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/toast-store';

export const TRANSACTIONS_PAGE_SIZE = 10;

export function useAccountTransactions(accountId: string, page: number) {
  const params = { page, limit: TRANSACTIONS_PAGE_SIZE };
  return useQuery({
    queryKey: queryKeys.accountTransactions(accountId, params),
    queryFn: () => fetchAccountTransactions(accountId, params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransaction,
    onSuccess: ({ transaction, account }) => {
      // Show the new balance immediately, then refresh lists and histories in the background.
      queryClient.setQueryData(queryKeys.accountDetail(account.id), account);
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      const label = transaction.type === 'credit' ? 'Credit' : 'Debit';
      toast.success(
        `${label} of ${formatMoney(transaction.amount)} recorded`,
        `New balance: ${formatMoney(account.balance)}`,
      );
    },
  });
}
