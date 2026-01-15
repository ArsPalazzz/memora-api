import logger from './logger';
import { httpServer } from './express';
import Postgres from './databases/postgre';
import { port, serviceName, postgresOptions } from './config';
import NotificationScheduler from './schedule/NotificationScheduler';
import StreakScheduler from './schedule/StreakScheduler';

let notificationScheduler: NotificationScheduler | null = null;
let streakScheduler: StreakScheduler | null = null;

const shutdown = async () => {
  logger.info(`⚠️ Gracefully shutting down`);

  if (notificationScheduler) {
    try {
      await notificationScheduler.stop();
      logger.info('🛑 Notification scheduler stopped');
    } catch (error) {
      logger.error('❌ Error stopping notification scheduler:', error);
    }
  }
  if (streakScheduler) {
    try {
      await streakScheduler.stop();
      logger.info('🛑 Streak scheduler stopped');
    } catch (error) {
      logger.error('❌ Error stopping streak scheduler:', error);
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
      notificationScheduler = new NotificationScheduler(logger);
    } catch (error) {
      logger.error('Failed to start notification scheduler:', error);
    }
    try {
      streakScheduler = new StreakScheduler(logger);
    } catch (error) {
      logger.error('Failed to start streak scheduler:', error);
    }
  } catch (err) {
    logger.error('Failed to connect to Postgres:', err);
    process.exit(1);
  }
};

startServer();

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
