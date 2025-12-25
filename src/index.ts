import logger from './logger';
import { httpServer } from './express';
import Postgres from './databases/postgre';
import { port, serviceName, postgresOptions } from './config';

const shutdown = async () => {
  logger.info(`⚠️ Gracefully shutting down`);

  httpServer.close(async () => {
    await Postgres.close();
    logger.info('👋 All requests stopped, shutting down');
    process.exit();
  });
};

Postgres.createConnection(postgresOptions);

httpServer
  .listen(port, '0.0.0.0', () => logger.info(`🚀 :: ${serviceName} is running on port :: ${port}`))
  .on('error', logger.error);

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
