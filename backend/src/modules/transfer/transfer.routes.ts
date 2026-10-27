import { Router } from 'express';

import { methodNotAllowed } from '@shared/middlewares/method-not-allowed';
import { validateRequest } from '@shared/middlewares/validate-request';
import { asyncHandler } from '@shared/utils/async-handler';

import * as transferController from './transfer.controller';
import { createTransferBodySchema } from './transfer.schema';

export const transferRouter = Router();

transferRouter
  .route('/')
  .post(
    validateRequest({ body: createTransferBodySchema }),
    asyncHandler(transferController.createTransfer),
  )
  .all(methodNotAllowed(['POST'], 'transfers are immutable'));
