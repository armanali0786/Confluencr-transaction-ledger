import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { TransactionType } from '@/types/api';

export function TransactionTypeBadge({ type }: { type: TransactionType }) {
  return type === 'credit' ? (
    <Badge tone="success">
      <ArrowDownLeft className="size-3" strokeWidth={2.5} aria-hidden />
      Credit
    </Badge>
  ) : (
    <Badge tone="danger">
      <ArrowUpRight className="size-3" strokeWidth={2.5} aria-hidden />
      Debit
    </Badge>
  );
}
