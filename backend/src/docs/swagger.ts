import { readFileSync } from 'node:fs';
import path from 'node:path';

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { parse } from 'yaml';

// The YAML spec is the single source of truth; the build copies it next to this file.
const SPEC_PATH = path.join(__dirname, 'openapi.yaml');

export const openApiDocument = parse(readFileSync(SPEC_PATH, 'utf8')) as Record<string, unknown>;

export const docsRouter = Router();

docsRouter.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});

docsRouter.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, { customSiteTitle: 'Ledger API docs' }),
);
