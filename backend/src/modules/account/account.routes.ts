import { Router } from 'express';

import { methodNotAllowed } from '@shared/middlewares/method-not-allowed';
import { validateRequest } from '@shared/middlewares/validate-request';
import { asyncHandler } from '@shared/utils/async-handler';

import * as accountController from './account.controller';
import { accountIdParamsSchema, createAccountBodySchema } from './account.schema';

// Accounts are never edited or deleted, which keeps their ledger history intact.
const ACCOUNTS_ARE_PERMANENT = 'accounts cannot be modified or deleted';

export const accountRouter = Router();

accountRouter
  .route('/')
  .post(
    validateRequest({ body: createAccountBodySchema }),
    asyncHandler(accountController.createAccount),
  )
  .get(asyncHandler(accountController.listAccounts))
  .all(methodNotAllowed(['GET', 'POST']));

accountRouter
  .route('/:accountId')
  .get(
    validateRequest({ params: accountIdParamsSchema }),
    asyncHandler(accountController.getAccount),
  )
  .all(methodNotAllowed(['GET'], ACCOUNTS_ARE_PERMANENT));
