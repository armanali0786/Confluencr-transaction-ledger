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
      className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Card className="flex h-full flex-col p-6 transition-all group-hover:border-primary/30 group-hover:shadow-level-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-md bg-primary/8 p-2">
              <Wallet className="size-5 text-primary" aria-hidden />
            </div>
            <h3 className="truncate text-heading-sm text-ink">{account.name}</h3>
          </div>
          <ChevronRight
            className="size-5 shrink-0 text-ink-mute/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden
          />
        </div>
        <p className="mt-8 text-micro-cap text-ink-mute uppercase">Balance</p>
        <p className="money mt-1.5 text-display-md text-ink">{formatMoney(account.balance)}</p>
        <p className="mt-4 text-caption text-ink-mute">Opened {formatDate(account.created_at)}</p>
      </Card>
    </Link>
  );
}

export function AccountCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-md" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="mt-8 h-2.5 w-14" />
      <Skeleton className="mt-2 h-7 w-36" />
      <Skeleton className="mt-4 h-3 w-24" />
    </Card>
  );
}
