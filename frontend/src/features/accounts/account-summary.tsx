import { ArrowLeftRight, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { buttonClasses } from '@/lib/button-styles';
import { formatDate, formatMoney } from '@/lib/format';
import type { Account } from '@/types/api';

interface AccountSummaryProps {
  account: Account;
  onNewTransaction: () => void;
}

const FEATURED_CARD_CLASSES =
  'rounded-xl bg-brand-dark-900 p-6 text-on-primary shadow-level-2 sm:p-8';

/** card-pricing-featured: the inverted deep-navy surface, used for the balance. */
export function AccountSummary({ account, onNewTransaction }: AccountSummaryProps) {
  return (
    <section aria-label="Account summary" className={FEATURED_CARD_CLASSES}>
      <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-heading-lg">{account.name}</h1>
          <p className="mt-1.5 font-mono text-caption break-all text-on-primary/55">{account.id}</p>
          <p className="mt-8 text-micro-cap text-on-primary/65 uppercase">Current balance</p>
          <p className="money mt-2 text-display-lg sm:text-display-xl">
            {formatMoney(account.balance)}
          </p>
          <p className="mt-3 text-caption text-on-primary/65">
            Opened {formatDate(account.created_at)}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to={`/transfer?from=${account.id}`}
            className={buttonClasses({ variant: 'outline-on-dark' })}
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
    </section>
  );
}

export function AccountSummarySkeleton() {
  return (
    <div className={FEATURED_CARD_CLASSES} aria-busy>
      <Skeleton className="h-5 w-48 bg-on-primary/15" />
      <Skeleton className="mt-2.5 h-3 w-72 max-w-full bg-on-primary/10" />
      <Skeleton className="mt-8 h-2.5 w-24 bg-on-primary/10" />
      <Skeleton className="mt-3 h-11 w-56 bg-on-primary/15" />
    </div>
  );
}
