import { ChevronRight, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatMoney } from '@/lib/format';
import type { Account } from '@/types/api';

export function AccountCard({ account }: { account: Account }) {
  return (
    <Link
      to={`/accounts/${account.id}`}
      className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <Card className="flex h-full flex-col p-5 transition-shadow group-hover:shadow-md group-hover:ring-brand-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-lg bg-brand-50 p-2">
              <Wallet className="size-5 text-brand-600" aria-hidden />
            </div>
            <h3 className="truncate font-medium text-slate-900">{account.name}</h3>
          </div>
          <ChevronRight
            className="size-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500"
            aria-hidden
          />
        </div>
        <p className="mt-6 text-xs font-medium tracking-wide text-slate-500 uppercase">Balance</p>
        <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">
          {formatMoney(account.balance)}
        </p>
        <p className="mt-4 text-xs text-slate-400">Opened {formatDate(account.created_at)}</p>
      </Card>
    </Link>
  );
}

export function AccountCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="mt-6 h-3 w-16" />
      <Skeleton className="mt-2 h-7 w-36" />
      <Skeleton className="mt-4 h-3 w-24" />
    </Card>
  );
}
