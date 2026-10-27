import { Router } from 'express';

import { accountRouter } from '@modules/account/account.routes';
import { healthRouter } from '@modules/health/health.routes';
import {
  accountTransactionRouter,
  transactionRouter,
} from '@modules/transaction/transaction.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/accounts/:accountId/transactions', accountTransactionRouter);
apiRouter.use('/accounts', accountRouter);
apiRouter.use('/transactions', transactionRouter);
