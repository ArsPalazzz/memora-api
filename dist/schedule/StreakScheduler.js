"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const StreakStatsRepository_1 = __importDefault(require("../databases/postgre/entities/user/StreakStatsRepository"));
const DailyStatsRepository_1 = __importDefault(require("../databases/postgre/entities/user/DailyStatsRepository"));
class StreakScheduler {
    constructor(logger) {
        this.logger = logger;
        this.scheduledTask = null;
        logger.info('Streak Scheduler started');
        this.scheduledTask = node_cron_1.default.schedule('0 21 * * *', () => {
            this.updateStreaksForMidnight();
        });
        this.updateStreaksForMidnight();
    }
    async stop() {
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
            const usersWithActivity = await DailyStatsRepository_1.default.getUsersWithActivityOnDate(yesterdayStr);
            this.logger.info(`Found ${usersWithActivity.length} users with activity yesterday`);
            for (const user of usersWithActivity) {
                try {
                    await this.updateUserStreak(user.user_id, yesterdayStr);
                }
                catch (userError) {
                    this.logger.error(`Error updating streak for user ${user.user_id}:`, userError);
                }
            }
            this.logger.info('✅ Streak update completed');
        }
        catch (error) {
            this.logger.error('❌ Error in updateStreaksForMidnight:', error);
        }
    }
    async updateUserStreak(userId, dateStr) {
        const streakData = await StreakStatsRepository_1.default.getByUserId(userId);
        if (!streakData) {
            return;
        }
        const lastStudyDate = await DailyStatsRepository_1.default.getLastStudyDate(userId);
        const yesterday = new Date(dateStr);
        if (lastStudyDate) {
            const dayDiff = Math.floor((yesterday.getTime() - lastStudyDate.getTime()) / (1000 * 3600 * 24));
            if (dayDiff === 1) {
                await StreakStatsRepository_1.default.incrementStreak(userId);
                this.logger.debug(`Increased streak for user ${userId} to ${streakData.current_streak + 1}`);
            }
            else if (dayDiff > 1) {
                await StreakStatsRepository_1.default.resetStreak(userId);
                this.logger.debug(`Reset streak for user ${userId} (gap: ${dayDiff} days)`);
            }
        }
        else {
            await StreakStatsRepository_1.default.resetStreak(userId);
            this.logger.debug(`Set first streak for user ${userId}`);
        }
    }
}
exports.default = StreakScheduler;
