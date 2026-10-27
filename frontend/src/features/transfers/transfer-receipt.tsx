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
        <CheckCircle2 className="mx-auto size-12 text-emerald-500" aria-hidden />
        <h2 className="mt-3 text-lg font-semibold text-slate-900">Transfer complete</h2>
        <p className="mt-1 text-sm text-slate-500">{formatDateTime(transfer.created_at)}</p>
        <p className="mt-4 text-3xl font-semibold text-slate-900 tabular-nums">
          {formatMoney(transfer.amount)}
        </p>
      </div>

      <dl className="divide-y divide-slate-100 rounded-lg text-left ring-1 ring-slate-200">
        {[accounts.from, accounts.to].map((account, index) => (
          <div key={account.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="min-w-0 text-sm">
              <span className="block text-xs text-slate-500">{index === 0 ? 'From' : 'To'}</span>
              <Link
                to={`/accounts/${account.id}`}
                className="block truncate font-medium text-brand-600 hover:text-brand-700"
              >
                {account.name}
              </Link>
            </dt>
            <dd className="text-right text-sm">
              <span className="block text-xs text-slate-500">New balance</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {formatMoney(account.balance)}
              </span>
            </dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 px-4 py-3 text-sm">
          <dt className="text-slate-500">Reference ID</dt>
          <dd className="truncate font-mono text-slate-900">{transfer.reference_id}</dd>
        </div>
      </dl>

      <Button className="w-full" onClick={onNewTransfer}>
        Make another transfer
      </Button>
    </div>
  );
}
