"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const CardService_1 = __importDefault(require("../services/cards/CardService"));
const ReviewService_1 = __importDefault(require("../services/reviews/ReviewService"));
class NotificationScheduler {
    constructor(logger) {
        this.logger = logger;
        this.scheduledTasks = [];
        logger.info('Notification Scheduler started');
        const task1 = node_cron_1.default.schedule('*/15 * * * *', () => {
            this.checkDueCards();
        });
        this.scheduledTasks.push(task1);
        const task2 = node_cron_1.default.schedule('0 10 * * *', () => {
            this.sendDailyReminders();
        });
        this.scheduledTasks.push(task2);
        const task3 = node_cron_1.default.schedule('0 19 * * *', () => {
            this.sendDailyReminders();
        });
        this.scheduledTasks.push(task3);
        this.checkDueCards();
    }
    async stop() {
        this.logger.info('Stopping notification scheduler...');
        for (const task of this.scheduledTasks) {
            task.stop();
        }
        this.scheduledTasks = [];
        this.logger.info('Notification scheduler stopped');
    }
    async checkDueCards() {
        try {
            const usersWithDueCards = await CardService_1.default.getUsersWithDueCards();
            this.logger.info(`📊 Got ${usersWithDueCards.length} users with due cards`);
            for (const user of usersWithDueCards) {
                await ReviewService_1.default.notifyUser(user.user_sub, user.due_count);
            }
        }
        catch (error) {
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
        }
        catch (error) {
            this.logger.error('Sending daily notifications error:', error);
        }
    }
}
exports.default = NotificationScheduler;
