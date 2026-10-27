import type { Transfer } from '@prisma/client';

import { type AccountResponse, toAccountResponse } from '@modules/account/account.mapper';
import {
  toTransactionResponse,
  type TransactionResponse,
} from '@modules/transaction/transaction.mapper';
import { formatMinorUnits } from '@shared/utils/money';

import type { CompletedTransfer } from './transfer.service';

interface TransferResponse {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: string;
  description: string | null;
  reference_id: string;
  created_at: string;
}

interface CompletedTransferResponse {
  transfer: TransferResponse;
  transactions: { debit: TransactionResponse; credit: TransactionResponse };
  accounts: { from: AccountResponse; to: AccountResponse };
}

function toTransferResponse(transfer: Transfer): TransferResponse {
  return {
    id: transfer.id,
    from_account_id: transfer.fromAccountId,
    to_account_id: transfer.toAccountId,
    amount: formatMinorUnits(transfer.amount),
    description: transfer.description,
    reference_id: transfer.referenceId,
    created_at: transfer.createdAt.toISOString(),
  };
}

export function toCompletedTransferResponse(result: CompletedTransfer): CompletedTransferResponse {
  return {
    transfer: toTransferResponse(result.transfer),
    transactions: {
      debit: toTransactionResponse(result.debit),
      credit: toTransactionResponse(result.credit),
    },
    accounts: {
      from: toAccountResponse(result.fromAccount),
      to: toAccountResponse(result.toAccount),
    },
  };
}
