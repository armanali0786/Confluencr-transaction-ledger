import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createTransfer } from '@/api/transfers';
import { formatMoney } from '@/lib/format';
import { queryKeys } from '@/lib/query-keys';
import { toast } from '@/lib/toast-store';

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransfer,
    onSuccess: ({ transfer, accounts }) => {
      queryClient.setQueryData(queryKeys.accountDetail(accounts.from.id), accounts.from);
      queryClient.setQueryData(queryKeys.accountDetail(accounts.to.id), accounts.to);
      void queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
      toast.success(
        `Transferred ${formatMoney(transfer.amount)}`,
        `${accounts.from.name} → ${accounts.to.name}`,
      );
    },
  });
}
