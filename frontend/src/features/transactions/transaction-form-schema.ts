import { z } from 'zod';

import { amountFieldSchema, isAmountWithinBalance } from '@/lib/money';

export const transactionFormSchema = (balance: string) =>
  z
    .object({
      type: z.enum(['credit', 'debit']),
      amount: amountFieldSchema,
      reference_id: z
        .string()
        .trim()
        .min(1, 'Reference ID is required')
        .max(64, 'Reference ID must be at most 64 characters'),
      description: z.string().trim().max(255, 'Description must be at most 255 characters'),
    })
    .refine(({ type, amount }) => type === 'credit' || isAmountWithinBalance(amount, balance), {
      message: 'Debit exceeds the current balance',
      path: ['amount'],
    });

export type TransactionFormValues = z.infer<ReturnType<typeof transactionFormSchema>>;
