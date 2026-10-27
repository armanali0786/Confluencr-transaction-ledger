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
    <div className="min-w-0 flex-1 rounded-md border border-hairline bg-canvas p-4">
      <p className="truncate text-body-md text-ink">{account.name}</p>
      <p className="mt-3 text-micro-cap text-ink-mute uppercase">Balance after</p>
      <p className="money mt-1 text-heading-lg text-ink">{formatMoney(after)}</p>
      <p className="money mt-1 text-caption text-ink-mute">was {formatMoney(account.balance)}</p>
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
      {/* card-cream-band: a warm interlude that frames the decision. */}
      <div className="rounded-lg bg-canvas-cream p-6 text-center sm:p-8">
        <p className="text-body-md text-ink-secondary">You are about to transfer</p>
        <p className="money mt-2 text-display-lg text-ink">{formatMoney(values.amount)}</p>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <BalanceChange account={source} delta={-amountCents} />
        <ArrowRight className="mx-auto size-5 rotate-90 text-ink-mute sm:rotate-0" aria-hidden />
        <BalanceChange account={destination} delta={amountCents} />
      </div>

      <dl className="divide-y divide-hairline rounded-md border border-hairline">
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-caption text-ink-mute">Reference ID</dt>
          <dd className="truncate font-mono text-caption text-ink">{values.reference_id}</dd>
        </div>
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-caption text-ink-mute">Description</dt>
          <dd className="truncate text-caption text-ink">{values.description || '—'}</dd>
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
