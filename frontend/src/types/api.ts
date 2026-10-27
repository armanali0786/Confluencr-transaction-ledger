/** Mirrors the backend response contract (snake_case JSON, money as 2-decimal strings). */

export interface PaginationMeta {
  current_page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
}

export interface ApiSuccess<TData> {
  success: true;
  data: TData;
  meta?: PaginationMeta;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export interface Page<TItem> {
  items: TItem[];
  meta: PaginationMeta;
}

export interface PageParams {
  page: number;
  limit: number;
}

export interface Account {
  id: string;
  name: string;
  balance: string;
  created_at: string;
  updated_at: string;
}

export type TransactionType = 'credit' | 'debit';

export interface Transaction {
  id: string;
  account_id: string;
  type: TransactionType;
  amount: string;
  description: string | null;
  reference_id: string;
  transfer_id: string | null;
  created_at: string;
}

export interface Transfer {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: string;
  description: string | null;
  reference_id: string;
  created_at: string;
}

export interface CreateAccountInput {
  name: string;
}

export interface CreateTransactionInput {
  account_id: string;
  type: TransactionType;
  amount: string;
  reference_id: string;
  description?: string;
}

export interface CreatedTransaction {
  transaction: Transaction;
  account: Account;
}

export interface CreateTransferInput {
  from_account_id: string;
  to_account_id: string;
  amount: string;
  reference_id: string;
  description?: string;
}

export interface CompletedTransfer {
  transfer: Transfer;
  transactions: { debit: Transaction; credit: Transaction };
  accounts: { from: Account; to: Account };
}
