import cron, { ScheduledTask } from 'node-cron';
import winston from 'winston';
import challengeNotificationService from '../services/challenge/ChallengeNotificationService';

class ChallengeNotificationScheduler {
  private scheduledTask: ScheduledTask | null = null;

  constructor(private readonly logger: winston.Logger) {
    logger.info('Challenge notification scheduler started');

    this.scheduledTask = cron.schedule('0 9 * * 1', () => {
      void this.sendWeeklyChallengeNotifications();
    });
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping challenge notification scheduler...');
    if (this.scheduledTask) {
      this.scheduledTask.stop();
    }
    this.scheduledTask = null;
    this.logger.info('Challenge notification scheduler stopped');
  }

  async sendWeeklyChallengeNotifications() {
    try {
      this.logger.info('Sending weekly challenge notifications...');
      await challengeNotificationService.sendWeeklyChallengeAnnouncements();
      this.logger.info('Weekly challenge notifications completed');
    } catch (error) {
      this.logger.error('Error sending weekly challenge notifications:', error);
    }
  }
}

export default ChallengeNotificationScheduler;
