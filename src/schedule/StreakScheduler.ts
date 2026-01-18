import cron, { ScheduledTask } from 'node-cron';
import winston from 'winston';
import streakStatsRepository from '../databases/postgre/entities/user/StreakStatsRepository';
import dailyStatsRepository from '../databases/postgre/entities/user/DailyStatsRepository';
import userRepository from '../databases/postgre/entities/user/UserRepository';

class StreakScheduler {
  private scheduledTask: ScheduledTask | null = null;

  constructor(private readonly logger: winston.Logger) {
    logger.info('Streak Scheduler started');

    this.scheduledTask = cron.schedule('0 21 * * *', () => {
      this.updateStreaksForMidnight();
    });

    this.updateStreaksForMidnight();
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping streak scheduler...');
    if (this.scheduledTask) {
      this.scheduledTask.stop();
    }
    this.scheduledTask = null;
    this.logger.info('Streak scheduler stopped');
  }

  async updateStreaksForMidnight() {
    try {
      this.logger.info('🔄 Updating streaks for midnight...');

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const allUserIds = await userRepository.getAllUserIds();

      for (const userId of allUserIds) {
        try {
          await this.updateUserStreak(userId, yesterdayStr);
        } catch (userError) {
          this.logger.error(`Error updating streak for user ${userId}:`, userError);
        }
      }

      this.logger.info('✅ Streak update completed');
    } catch (error) {
      this.logger.error('❌ Error in updateStreaksForMidnight:', error);
    }
  }

  private async updateUserStreak(userId: number, yesterdayStr: string) {
    const streakData = await streakStatsRepository.getByUserId(userId);
    if (!streakData) return;

    const yesterdayStats = await dailyStatsRepository.getStatsForDate(userId, yesterdayStr);

    if (!yesterdayStats) {
      await streakStatsRepository.resetStreak(userId);
      this.logger.debug(`Reset streak for user ${userId} (didn't study yesterday)`);
      return;
    }

    if (yesterdayStats.goal_achieved) {
      await streakStatsRepository.incrementStreak(userId);
      this.logger.debug(`Increased streak for user ${userId} to ${streakData.current_streak + 1}`);
    } else {
      await streakStatsRepository.resetStreak(userId);
      this.logger.debug(`Reset streak for user ${userId} (didn't complete goal)`);
    }
  }
}

export default StreakScheduler;
