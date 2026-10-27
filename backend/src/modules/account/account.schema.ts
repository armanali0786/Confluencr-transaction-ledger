import { z } from 'zod';

const ACCOUNT_NAME_MAX_LENGTH = 100;

export const createAccountBodySchema = z.strictObject({
  name: z
    .string({ error: 'name is required and must be a string' })
    .trim()
    .min(1, 'name must not be empty')
    .max(ACCOUNT_NAME_MAX_LENGTH, `name must be at most ${ACCOUNT_NAME_MAX_LENGTH} characters`),
});

export const accountIdParamsSchema = z.object({
  accountId: z.uuid({ error: 'accountId must be a valid UUID' }),
});

export type CreateAccountBody = z.infer<typeof createAccountBodySchema>;
export type AccountIdParams = z.infer<typeof accountIdParamsSchema>;
