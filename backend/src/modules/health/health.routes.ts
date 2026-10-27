import { Router } from 'express';

import { methodNotAllowed } from '@shared/middlewares/method-not-allowed';
import { asyncHandler } from '@shared/utils/async-handler';

import { getHealth } from './health.controller';

export const healthRouter = Router();

healthRouter
  .route('/')
  .get(asyncHandler(getHealth))
  .all(methodNotAllowed(['GET']));
