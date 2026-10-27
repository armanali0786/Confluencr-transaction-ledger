import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createAccount, fetchAccount, fetchAccounts } from '@/api/accounts';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/toast-store';

export const ACCOUNTS_PAGE_SIZE = 9;
/** The API's maximum page size; enough to populate account pickers for this app. */
export const ACCOUNT_PICKER_LIMIT = 100;

export function useAccounts(page: number, limit = ACCOUNTS_PAGE_SIZE) {
  const params = { page, limit };
  return useQuery({
    queryKey: queryKeys.accountList(params),
    queryFn: () => fetchAccounts(params),
    placeholderData: keepPreviousData,
  });
}

export function useAccountOptions() {
  return useAccounts(1, ACCOUNT_PICKER_LIMIT);
}

export function useAccount(accountId: string) {
  return useQuery({
    queryKey: queryKeys.accountDetail(accountId),
    queryFn: () => fetchAccount(accountId),
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAccount,
    onSuccess: (account) => {
      queryClient.setQueryData(queryKeys.accountDetail(account.id), account);
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      toast.success('Account created', `"${account.name}" is ready to use.`);
    },
  });
}
