import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/format';
import { fromCents, toCents } from '@/lib/money';
import type { Account } from '@/types/api';

import type { TransferFormValues } from './transfer-form-schema';

interface TransferReviewProps {
  values: TransferFormValues;
  source: Account;
  destination: Account;
  isSubmitting: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

function BalanceChange({ account, delta }: { account: Account; delta: bigint }) {
  const after = fromCents(toCents(account.balance) + delta);

  return (
    <div className="min-w-0 flex-1 rounded-lg bg-slate-50 p-4">
      <p className="truncate text-sm font-medium text-slate-900">{account.name}</p>
      <p className="mt-2 text-xs text-slate-500">Balance after</p>
      <p className="text-lg font-semibold text-slate-900 tabular-nums">{formatMoney(after)}</p>
      <p className="text-xs text-slate-400 tabular-nums">was {formatMoney(account.balance)}</p>
    </div>
  );
}

/** Confirmation step: money only moves after the user has seen exactly what will happen. */
export function TransferReview({
  values,
  source,
  destination,
  isSubmitting,
  onBack,
  onConfirm,
}: TransferReviewProps) {
  const amountCents = toCents(values.amount);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-slate-500">You are about to transfer</p>
        <p className="mt-1 text-3xl font-semibold text-slate-900 tabular-nums">
          {formatMoney(values.amount)}
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <BalanceChange account={source} delta={-amountCents} />
        <ArrowRight className="mx-auto size-5 rotate-90 text-slate-400 sm:rotate-0" aria-hidden />
        <BalanceChange account={destination} delta={amountCents} />
      </div>

      <dl className="divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200">
        <div className="flex justify-between gap-4 px-4 py-3 text-sm">
          <dt className="text-slate-500">Reference ID</dt>
          <dd className="truncate font-mono text-slate-900">{values.reference_id}</dd>
        </div>
        <div className="flex justify-between gap-4 px-4 py-3 text-sm">
          <dt className="text-slate-500">Description</dt>
          <dd className="truncate text-slate-900">{values.description || '—'}</dd>
        </div>
      </dl>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <Button variant="secondary" className="flex-1" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button className="flex-1" onClick={onConfirm} isLoading={isSubmitting}>
          Confirm transfer
        </Button>
      </div>
    </div>
  );
}
