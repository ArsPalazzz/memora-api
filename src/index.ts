import logger from './logger';
import { app, httpServer } from './express';
import Postgres from './databases/postgre';
import { serviceName, postgresOptions } from './config';

const shutdown = async () => {
  logger.info(`⚠️ Gracefully shutting down`);

  // httpServer.close(async () => {
  //   await Postgres.close();
  //   logger.info('👋 All requests stopped, shutting down');
  //   process.exit();
  // });
};

const port = Number(process.env.PORT);

if (!port) {
  throw new Error('PORT is not defined');
}

const startServer = async () => {
  try {
    await Postgres.createConnection(postgresOptions);
    app
      .listen(port, '0.0.0.0', () =>
        logger.info(`🚀 :: ${serviceName} is running on port :: ${port}`)
      )
      .on('error', logger.error);
  } catch (err) {
    logger.error('Failed to connect to Postgres:', err);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
