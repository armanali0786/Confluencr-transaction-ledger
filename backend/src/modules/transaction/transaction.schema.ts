import { TransactionType } from '@prisma/client';
import { z } from 'zod';

import { amountSchema } from '@shared/utils/amount-schema';

export const REFERENCE_ID_MAX_LENGTH = 64;
export const DESCRIPTION_MAX_LENGTH = 255;

export const referenceIdSchema = z
  .string({ error: 'reference_id is required and must be a string' })
  .trim()
  .min(1, 'reference_id must not be empty')
  .max(
    REFERENCE_ID_MAX_LENGTH,
    `reference_id must be at most ${REFERENCE_ID_MAX_LENGTH} characters`,
  );

export const descriptionSchema = z
  .string({ error: 'description must be a string' })
  .trim()
  .max(DESCRIPTION_MAX_LENGTH, `description must be at most ${DESCRIPTION_MAX_LENGTH} characters`)
  .nullish()
  .transform((description) => description || null);

export const createTransactionBodySchema = z.strictObject({
  account_id: z.uuid({ error: 'account_id must be a valid UUID' }),
  type: z.enum(TransactionType, { error: "type must be either 'credit' or 'debit'" }),
  amount: amountSchema,
  reference_id: referenceIdSchema,
  description: descriptionSchema,
});

export type CreateTransactionBody = z.infer<typeof createTransactionBodySchema>;
