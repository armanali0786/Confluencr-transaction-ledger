import { Router } from 'express';

import { accountRouter } from '@modules/account/account.routes';
import { healthRouter } from '@modules/health/health.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/accounts', accountRouter);
