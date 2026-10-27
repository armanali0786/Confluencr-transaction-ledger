import { env } from '@config/env';
import { logger } from '@config/logger';
import { prisma } from '@db/prisma';

import { createApp } from './app';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const server = createApp().listen(env.PORT, () => {
  logger.info(`Server listening on http://localhost:${env.PORT}`);
});

let isShuttingDown = false;

async function shutdown(signal: string, exitCode = 0): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info({ signal }, 'Shutting down gracefully');

  // Force exit if in-flight requests or the DB hang, so orchestrators are not left waiting.
  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  server.close(async (closeError) => {
    await prisma.$disconnect();
    if (closeError) {
      logger.error({ err: closeError }, 'Error while closing HTTP server');
      process.exit(1);
    }
    logger.info('Shutdown complete');
    process.exit(exitCode);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  void shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  void shutdown('uncaughtException', 1);
});
