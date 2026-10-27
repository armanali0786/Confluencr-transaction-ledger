import express, { type Express, type Router } from 'express';

import { errorHandler } from '@shared/middlewares/error-handler';
import { notFoundHandler } from '@shared/middlewares/not-found-handler';
import { requestId } from '@shared/middlewares/request-id';

/** Mounts a router behind the real request-id and error middlewares, for testing middleware in isolation. */
export function buildTestApp(router: Router): Express {
  const app = express();

  app.use(requestId);
  app.use(express.json());
  app.use(router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
