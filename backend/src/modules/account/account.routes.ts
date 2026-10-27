import { Router } from 'express';

import { validateRequest } from '@shared/middlewares/validate-request';
import { asyncHandler } from '@shared/utils/async-handler';

import * as accountController from './account.controller';
import { accountIdParamsSchema, createAccountBodySchema } from './account.schema';

export const accountRouter = Router();

accountRouter.post(
  '/',
  validateRequest({ body: createAccountBodySchema }),
  asyncHandler(accountController.createAccount),
);

accountRouter.get('/', asyncHandler(accountController.listAccounts));

accountRouter.get(
  '/:accountId',
  validateRequest({ params: accountIdParamsSchema }),
  asyncHandler(accountController.getAccount),
);
