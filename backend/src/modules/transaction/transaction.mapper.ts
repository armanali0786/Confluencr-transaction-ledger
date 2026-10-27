import type { Transaction, TransactionType } from '@prisma/client';

import { formatMinorUnits } from '@shared/utils/money';

export interface TransactionResponse {
  id: string;
  account_id: string;
  type: TransactionType;
  amount: string;
  description: string | null;
  reference_id: string;
  transfer_id: string | null;
  created_at: string;
}

export function toTransactionResponse(transaction: Transaction): TransactionResponse {
  return {
    id: transaction.id,
    account_id: transaction.accountId,
    type: transaction.type,
    amount: formatMinorUnits(transaction.amount),
    description: transaction.description,
    reference_id: transaction.referenceId,
    transfer_id: transaction.transferId,
    created_at: transaction.createdAt.toISOString(),
  };
}
