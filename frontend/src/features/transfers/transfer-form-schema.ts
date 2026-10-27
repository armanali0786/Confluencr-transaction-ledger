import { z } from 'zod';

import { amountFieldSchema, isAmountWithinBalance } from '@/lib/money';
import type { Account } from '@/types/api';

export const transferFormSchema = (accounts: Account[]) =>
  z
    .object({
      from_account_id: z.string().min(1, 'Choose the account to send from'),
      to_account_id: z.string().min(1, 'Choose the account to send to'),
      amount: amountFieldSchema,
      reference_id: z
        .string()
        .trim()
        .min(1, 'Reference ID is required')
        .max(64, 'Reference ID must be at most 64 characters'),
      description: z.string().trim().max(255, 'Description must be at most 255 characters'),
    })
    .refine(
      // Blank selections are already reported by the required checks above.
      ({ from_account_id, to_account_id }) => !from_account_id || from_account_id !== to_account_id,
      {
        message: 'Choose two different accounts',
        path: ['to_account_id'],
      },
    )
    .refine(
      ({ from_account_id, amount }) => {
        const source = accounts.find((account) => account.id === from_account_id);
        return !source || isAmountWithinBalance(amount, source.balance);
      },
      { message: 'Amount exceeds the source account balance', path: ['amount'] },
    );

export type TransferFormValues = z.infer<ReturnType<typeof transferFormSchema>>;
