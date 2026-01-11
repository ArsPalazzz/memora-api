import logger from './logger';
import { httpServer } from './express';
import Postgres from './databases/postgre';
import { port, serviceName, postgresOptions } from './config';
import NotificationScheduler from './schedule/NotificationScheduler';

let scheduler: NotificationScheduler | null = null;

const shutdown = async () => {
  logger.info(`⚠️ Gracefully shutting down`);

  if (scheduler) {
    try {
      await scheduler.stop();
      logger.info('🛑 Notification scheduler stopped');
    } catch (error) {
      logger.error('❌ Error stopping notification scheduler:', error);
    }
  }

  httpServer.close(async () => {
    await Postgres.close();
    logger.info('👋 All requests stopped, shutting down');
    process.exit();
  });
};

const startServer = async () => {
  try {
    await Postgres.createConnection(postgresOptions);
    httpServer
      .listen(port, '0.0.0.0', () =>
        logger.info(`🚀 :: ${serviceName} is running on port :: ${port}`)
      )
      .on('error', logger.error);

    try {
      scheduler = new NotificationScheduler(logger);
    } catch (error) {
      logger.error('Failed to start notification scheduler:', error);
    }
  } catch (err) {
    logger.error('Failed to connect to Postgres:', err);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
