import cron, { ScheduledTask } from 'node-cron';
import winston from 'winston';
import streakStatsRepository from '../databases/postgre/entities/user/StreakStatsRepository';
import dailyStatsRepository from '../databases/postgre/entities/user/DailyStatsRepository';

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

      const usersWithActivity = await dailyStatsRepository.getUsersWithActivityOnDate(yesterdayStr);

      this.logger.info(`Found ${usersWithActivity.length} users with activity yesterday`);

      for (const user of usersWithActivity) {
        try {
          await this.updateUserStreak(user.user_id, yesterdayStr);
        } catch (userError) {
          this.logger.error(`Error updating streak for user ${user.user_id}:`, userError);
        }
      }

      this.logger.info('✅ Streak update completed');
    } catch (error) {
      this.logger.error('❌ Error in updateStreaksForMidnight:', error);
    }
  }

  private async updateUserStreak(userId: number, dateStr: string) {
    const streakData = await streakStatsRepository.getByUserId(userId);

    if (!streakData) {
      return;
    }

    const lastStudyDate = await dailyStatsRepository.getLastStudyDate(userId);
    const yesterday = new Date(dateStr);

    if (lastStudyDate) {
      const dayDiff = Math.floor(
        (yesterday.getTime() - lastStudyDate.getTime()) / (1000 * 3600 * 24)
      );

      if (dayDiff === 1) {
        await streakStatsRepository.incrementStreak(userId);
        this.logger.debug(
          `Increased streak for user ${userId} to ${streakData.current_streak + 1}`
        );
      } else if (dayDiff > 1) {
        await streakStatsRepository.resetStreak(userId);
        this.logger.debug(`Reset streak for user ${userId} (gap: ${dayDiff} days)`);
      }
    } else {
      await streakStatsRepository.resetStreak(userId);
      this.logger.debug(`Set first streak for user ${userId}`);
    }
  }
}

export default StreakScheduler;
