import type { Account } from '@prisma/client';

import { formatMinorUnits } from '@shared/utils/money';

export interface AccountResponse {
  id: string;
  name: string;
  balance: string;
  created_at: string;
  updated_at: string;
}

export function toAccountResponse(account: Account): AccountResponse {
  return {
    id: account.id,
    name: account.name,
    balance: formatMinorUnits(account.balance),
    created_at: account.createdAt.toISOString(),
    updated_at: account.updatedAt.toISOString(),
  };
}
