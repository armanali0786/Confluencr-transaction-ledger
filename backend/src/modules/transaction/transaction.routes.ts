import { Router } from 'express';

import { accountIdParamsSchema } from '@modules/account/account.schema';
import { methodNotAllowed } from '@shared/middlewares/method-not-allowed';
import { validateRequest } from '@shared/middlewares/validate-request';
import { asyncHandler } from '@shared/utils/async-handler';

import * as transactionController from './transaction.controller';
import { createTransactionBodySchema, transactionIdParamsSchema } from './transaction.schema';

const TRANSACTIONS_ARE_IMMUTABLE = 'transactions are immutable';

export const transactionRouter = Router();

transactionRouter
  .route('/')
  .post(
    validateRequest({ body: createTransactionBodySchema }),
    asyncHandler(transactionController.createTransaction),
  )
  .all(methodNotAllowed(['POST'], TRANSACTIONS_ARE_IMMUTABLE));

transactionRouter
  .route('/:transactionId')
  .get(
    validateRequest({ params: transactionIdParamsSchema }),
    asyncHandler(transactionController.getTransaction),
  )
  .all(methodNotAllowed(['GET'], TRANSACTIONS_ARE_IMMUTABLE));

/** Mounted at /accounts/:accountId/transactions; mergeParams exposes :accountId. */
export const accountTransactionRouter = Router({ mergeParams: true });

accountTransactionRouter
  .route('/')
  .get(
    validateRequest({ params: accountIdParamsSchema }),
    asyncHandler(transactionController.listAccountTransactions),
  )
  .all(methodNotAllowed(['GET'], TRANSACTIONS_ARE_IMMUTABLE));
