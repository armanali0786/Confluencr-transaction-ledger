import { z } from 'zod';

import { descriptionSchema, referenceIdSchema } from '@modules/transaction/transaction.schema';
import { amountSchema } from '@shared/utils/amount-schema';

// Lower-cased so the same account written in different letter cases is recognised as
// one account by the same-account check (Postgres compares UUIDs case-insensitively).
function accountIdSchema(field: string) {
  return z.uuid({ error: `${field} must be a valid UUID` }).transform((id) => id.toLowerCase());
}

export const createTransferBodySchema = z.strictObject({
  from_account_id: accountIdSchema('from_account_id'),
  to_account_id: accountIdSchema('to_account_id'),
  amount: amountSchema,
  reference_id: referenceIdSchema,
  description: descriptionSchema,
});

export type CreateTransferBody = z.infer<typeof createTransferBodySchema>;
