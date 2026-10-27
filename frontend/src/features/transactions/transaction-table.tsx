import { ArrowLeftRight, Receipt } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/cn';
import { formatDateTime, formatMoney } from '@/lib/format';
import type { Transaction } from '@/types/api';

import { TransactionTypeBadge } from './transaction-type-badge';
import { TRANSACTIONS_PAGE_SIZE, useAccountTransactions } from './use-transactions';

// On narrow screens the date moves under the description and the signed, coloured
// amount conveys the type, so the amount column is never pushed off-screen.
const WIDE_ONLY = 'hidden sm:table-cell';

interface TransactionTableProps {
  accountId: string;
  page: number;
  onPageChange: (page: number) => void;
}

export function TransactionTable({ accountId, page, onPageChange }: TransactionTableProps) {
  const { data, error, isPending, isFetching, refetch } = useAccountTransactions(accountId, page);

  if (error) {
    return (
      <ErrorState
        error={error}
        title="Could not load transactions"
        onRetry={() => void refetch()}
      />
    );
  }

  if (!isPending && data.items.length === 0) {
    return page > 1 ? (
      <EmptyState
        icon={Receipt}
        title="No transactions on this page"
        description="This page is past the end of the history."
        action={
          <button
            type="button"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
            onClick={() => onPageChange(1)}
          >
            Go to the first page
          </button>
        }
      />
    ) : (
      <EmptyState
        icon={Receipt}
        title="No transactions yet"
        description="Credits, debits and transfers for this account will appear here."
      />
    );
  }

  return (
    <div className={cn('transition-opacity', isFetching && !isPending && 'opacity-60')}>
      <Table>
        <caption className="sr-only">Transactions, latest first</caption>
        <TableHead>
          <tr>
            <TableHeaderCell className={WIDE_ONLY}>Date</TableHeaderCell>
            <TableHeaderCell>Description</TableHeaderCell>
            <TableHeaderCell className={WIDE_ONLY}>Type</TableHeaderCell>
            <TableHeaderCell className="text-right">Amount</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {isPending ? (
            <TransactionRowsSkeleton />
          ) : (
            data.items.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))
          )}
        </TableBody>
      </Table>
      {data && <Pagination meta={data.meta} onPageChange={onPageChange} isFetching={isFetching} />}
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isCredit = transaction.type === 'credit';

  return (
    <TableRow>
      <TableCell className={cn(WIDE_ONLY, 'text-slate-500')}>
        {formatDateTime(transaction.created_at)}
      </TableCell>
      <TableCell className="max-w-[12rem] sm:max-w-xs">
        <p className="truncate font-medium text-slate-900">
          {transaction.description ?? <span className="text-slate-400">No description</span>}
        </p>
        <p className="truncate font-mono text-xs text-slate-400">{transaction.reference_id}</p>
        <p className="text-xs text-slate-500 sm:hidden">
          {formatDateTime(transaction.created_at)}
          {transaction.transfer_id && ' · Transfer'}
        </p>
      </TableCell>
      <TableCell className={WIDE_ONLY}>
        <div className="flex items-center gap-1.5">
          <TransactionTypeBadge type={transaction.type} />
          {transaction.transfer_id && (
            <Badge tone="brand">
              <ArrowLeftRight className="size-3" aria-hidden />
              Transfer
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell
        className={cn(
          'text-right font-semibold tabular-nums',
          isCredit ? 'text-emerald-600' : 'text-rose-600',
        )}
      >
        {isCredit ? '+' : '−'}
        {formatMoney(transaction.amount)}
      </TableCell>
    </TableRow>
  );
}

function TransactionRowsSkeleton() {
  return Array.from({ length: Math.min(TRANSACTIONS_PAGE_SIZE, 5) }, (_, index) => (
    <TableRow key={index}>
      <TableCell className={WIDE_ONLY}>
        <Skeleton className="h-4 w-32" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-1.5 h-3 w-24" />
      </TableCell>
      <TableCell className={WIDE_ONLY}>
        <Skeleton className="h-5 w-16" />
      </TableCell>
      <TableCell>
        <Skeleton className="ml-auto h-4 w-20" />
      </TableCell>
    </TableRow>
  ));
}
