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
        const task = node_cron_1.default.schedule('*/15 * * * *', () => {
            this.checkDueCards();
        });
        this.scheduledTasks.push(task);
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
}
exports.default = NotificationScheduler;
