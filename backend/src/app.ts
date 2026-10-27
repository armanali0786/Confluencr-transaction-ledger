import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';

import { env } from '@config/env';
import { errorHandler } from '@shared/middlewares/error-handler';
import { httpLogger } from '@shared/middlewares/http-logger';
import { notFoundHandler } from '@shared/middlewares/not-found-handler';
import { REQUEST_ID_HEADER, requestId } from '@shared/middlewares/request-id';

import { docsRouter } from './docs/swagger';
import { apiRouter } from './routes';

const API_PREFIX = '/api/v1';
const DOCS_PATH = '/api/docs';
const JSON_BODY_LIMIT = '100kb';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestId);
  app.use(httpLogger);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, exposedHeaders: [REQUEST_ID_HEADER] }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.use(API_PREFIX, apiRouter);
  app.use(DOCS_PATH, docsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
