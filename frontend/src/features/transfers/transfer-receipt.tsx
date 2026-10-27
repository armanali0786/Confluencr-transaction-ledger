import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { formatDateTime, formatMoney } from '@/lib/format';
import type { CompletedTransfer } from '@/types/api';

interface TransferReceiptProps {
  result: CompletedTransfer;
  onNewTransfer: () => void;
}

export function TransferReceipt({ result, onNewTransfer }: TransferReceiptProps) {
  const { transfer, accounts } = result;

  return (
    <div className="space-y-6 text-center">
      <div>
        <div className="mx-auto w-fit rounded-full bg-success/10 p-3">
          <CheckCircle2 className="size-8 text-success" aria-hidden />
        </div>
        <h2 className="mt-4 text-heading-lg text-ink">Transfer complete</h2>
        <p className="money mt-1.5 text-caption text-ink-mute">
          {formatDateTime(transfer.created_at)}
        </p>
        <p className="money mt-5 text-display-lg text-ink">{formatMoney(transfer.amount)}</p>
      </div>

      <dl className="divide-y divide-hairline rounded-md border border-hairline text-left">
        {[accounts.from, accounts.to].map((account, index) => (
          <div key={account.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="min-w-0">
              <span className="block text-micro-cap text-ink-mute uppercase">
                {index === 0 ? 'From' : 'To'}
              </span>
              <Link
                to={`/accounts/${account.id}`}
                className="mt-0.5 block truncate text-body-md text-primary hover:text-primary-deep"
              >
                {account.name}
              </Link>
            </dt>
            <dd className="text-right">
              <span className="block text-micro-cap text-ink-mute uppercase">New balance</span>
              <span className="money mt-0.5 block text-body-md font-normal text-ink">
                {formatMoney(account.balance)}
              </span>
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-caption text-ink-mute">Reference ID</dt>
          <dd className="truncate font-mono text-caption text-ink">{transfer.reference_id}</dd>
        </div>
      </dl>

      <Button className="w-full" onClick={onNewTransfer}>
        Make another transfer
      </Button>
    </div>
  );
}
