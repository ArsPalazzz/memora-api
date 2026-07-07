import cron, { ScheduledTask } from 'node-cron';
import winston from 'winston';
import userRepository from '../databases/postgre/entities/user/UserRepository';
import leagueNotificationService from '../services/users/LeagueNotificationService';

class LeagueNotificationScheduler {
  private scheduledTask: ScheduledTask | null = null;

  constructor(private readonly logger: winston.Logger) {
    logger.info('League notification scheduler started');

    this.scheduledTask = cron.schedule('30 21 * * *', () => {
      void this.checkLeagueNotifications();
    });
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping league notification scheduler...');
    if (this.scheduledTask) {
      this.scheduledTask.stop();
    }
    this.scheduledTask = null;
    this.logger.info('League notification scheduler stopped');
  }

  async checkLeagueNotifications() {
    try {
      this.logger.info('Checking weekly league overtakes...');

      const users = await userRepository.getUsersForLeagueNotifications();
      for (const user of users) {
        try {
          await leagueNotificationService.checkLeagueOvertakeForUser(user.sub);
        } catch (userError) {
          this.logger.error(`Error checking league notification for user ${user.sub}:`, userError);
        }
      }

      this.logger.info(`League notification check completed for ${users.length} users`);
    } catch (error) {
      this.logger.error('Error during league notification check:', error);
    }
  }
}

export default LeagueNotificationScheduler;
