import { ArrowLeftRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatMoney } from '@/lib/format';
import type { Account } from '@/types/api';

interface AccountSummaryProps {
  account: Account;
  onNewTransaction: () => void;
}

export function AccountSummary({ account, onNewTransaction }: AccountSummaryProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-slate-900">{account.name}</h1>
          <p className="mt-1 font-mono text-xs break-all text-slate-400">{account.id}</p>
          <p className="mt-5 text-xs font-medium tracking-wide text-slate-500 uppercase">
            Current balance
          </p>
          <p className="mt-1 text-3xl font-semibold text-slate-900 tabular-nums sm:text-4xl">
            {formatMoney(account.balance)}
          </p>
          <p className="mt-2 text-xs text-slate-400">Opened {formatDate(account.created_at)}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to={`/transfer?from=${account.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-300 ring-inset hover:bg-slate-50"
          >
            <ArrowLeftRight className="size-4" aria-hidden />
            Transfer
          </Link>
          <Button onClick={onNewTransaction}>
            <Plus className="size-4" aria-hidden />
            New transaction
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function AccountSummarySkeleton() {
  return (
    <Card className="p-6">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-2 h-3 w-72 max-w-full" />
      <Skeleton className="mt-6 h-3 w-28" />
      <Skeleton className="mt-2 h-9 w-52" />
    </Card>
  );
}
