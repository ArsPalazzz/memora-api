import cron, { ScheduledTask } from 'node-cron';
import cardService from '../services/cards/CardService';
import reviewService from '../services/reviews/ReviewService';
import winston from 'winston';

class NotificationScheduler {
  private scheduledTasks: ScheduledTask[] = [];

  constructor(private readonly logger: winston.Logger) {
    logger.info('Notification Scheduler started');

    const task1 = cron.schedule('*/15 * * * *', () => {
      this.checkDueCards();
    });
    this.scheduledTasks.push(task1);

    const task2 = cron.schedule('0 10 * * *', () => {
      this.sendDailyReminders();
    });
    this.scheduledTasks.push(task2);

    const task3 = cron.schedule('0 19 * * *', () => {
      this.sendDailyReminders();
    });
    this.scheduledTasks.push(task3);

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

  async sendDailyReminders() {
    try {
      this.logger.info('Sending daily notifications...');

      // const inactiveUsers = await db.query(`
      //   SELECT p.sub as user_sub
      //   FROM users.profile p
      //   WHERE NOT EXISTS (
      //     SELECT 1 FROM games.session s
      //     WHERE s.user_sub = p.sub
      //     AND s.created_at::date = CURRENT_DATE
      //   )
      //   AND EXISTS (
      //     SELECT 1 FROM cards.user_card_srs ucs
      //     WHERE ucs.user_sub = p.sub
      //     AND ucs.next_review <= NOW() + INTERVAL '1 day'
      //   )
      //   LIMIT 50
      // `);

      // for (const user of inactiveUsers.rows) {
      //   const tokens = await db.query(
      //     `
      //     SELECT token FROM notifications.fcm_token
      //     WHERE user_sub = $1 AND is_active = true
      //   `,
      //     [user.user_sub]
      //   );

      //   if (tokens.rows.length === 0) continue;

      //   const message = {
      //     title: "Didn't you forget to revise some words?",
      //     body: "You haven't practiced today. Spend 5 minutes!",
      //     data: {
      //       type: 'daily_reminder',
      //       action: 'open_app',
      //     },
      //   };

      //   for (const tokenRow of tokens.rows) {
      //     await sendPushNotification(tokenRow.token, message);
      //   }
      // }
    } catch (error) {
      this.logger.error('Sending daily notifications error:', error);
    }
  }
}

export default NotificationScheduler;
