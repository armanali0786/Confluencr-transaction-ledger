import { Router } from 'express';

import { validateRequest } from '@shared/middlewares/validate-request';
import { asyncHandler } from '@shared/utils/async-handler';

import * as transactionController from './transaction.controller';
import { createTransactionBodySchema } from './transaction.schema';

export const transactionRouter = Router();

transactionRouter.post(
  '/',
  validateRequest({ body: createTransactionBodySchema }),
  asyncHandler(transactionController.createTransaction),
);
