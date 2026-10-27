import { pinoHttp } from 'pino-http';

import { logger } from '@config/logger';

const SERVER_ERROR_STATUS = 500;
const CLIENT_ERROR_STATUS = 400;

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.id,
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= SERVER_ERROR_STATUS) return 'error';
    if (res.statusCode >= CLIENT_ERROR_STATUS) return 'warn';
    return 'info';
  },
  serializers: {
    req: (req: { id: string; method: string; url: string }) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
  },
});
