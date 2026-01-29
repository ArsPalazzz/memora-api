import cron, { ScheduledTask } from 'node-cron';
import cardService from '../services/cards/CardService';
import reviewService from '../services/reviews/ReviewService';
import winston from 'winston';

class NotificationScheduler {
  private scheduledTasks: ScheduledTask[] = [];

  constructor(private readonly logger: winston.Logger) {
    logger.info('Notification Scheduler started');

    const task = cron.schedule('*/15 * * * *', () => {
      this.checkDueCards();
    });
    this.scheduledTasks.push(task);

    this.checkDueCards();
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping notification scheduler...');

    for (const task of this.scheduledTasks) {
      task.stop();
    }

    this.scheduledTasks = [];
    this.logger.info('Notification scheduler stopped');
  }

  async checkDueCards() {
    try {
      const usersWithDueCards = await cardService.getUsersWithDueCards();

      this.logger.info(`📊 Got ${usersWithDueCards.length} users with due cards`);

      for (const user of usersWithDueCards) {
        await reviewService.notifyUser(user.user_sub, user.due_count);
      }
    } catch (error) {
      this.logger.error('❌ Error in checkDueCards:', error);
    }
  }
}

export default NotificationScheduler;
