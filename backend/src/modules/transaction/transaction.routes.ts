import { Router } from 'express';

import { accountIdParamsSchema } from '@modules/account/account.schema';
import { validateRequest } from '@shared/middlewares/validate-request';
import { asyncHandler } from '@shared/utils/async-handler';

import * as transactionController from './transaction.controller';
import { createTransactionBodySchema, transactionIdParamsSchema } from './transaction.schema';

export const transactionRouter = Router();

transactionRouter.post(
  '/',
  validateRequest({ body: createTransactionBodySchema }),
  asyncHandler(transactionController.createTransaction),
);

transactionRouter.get(
  '/:transactionId',
  validateRequest({ params: transactionIdParamsSchema }),
  asyncHandler(transactionController.getTransaction),
);

/** Mounted at /accounts/:accountId/transactions; mergeParams exposes :accountId. */
export const accountTransactionRouter = Router({ mergeParams: true });

accountTransactionRouter.get(
  '/',
  validateRequest({ params: accountIdParamsSchema }),
  asyncHandler(transactionController.listAccountTransactions),
);
