import express from 'express';

import { env } from '@config/env';
import { logger } from '@config/logger';

const app = express();

app.listen(env.PORT, () => {
  logger.info(`Server listening on http://localhost:${env.PORT}`);
});
