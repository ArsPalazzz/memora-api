"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyStatsRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
const DailyStatsRepositoryQueries_1 = require("./DailyStatsRepositoryQueries");
class DailyStatsRepository extends Table_1.default {
    async existByUserId(params) {
        const query = {
            name: 'existDailyStatsByUserId',
            text: DailyStatsRepositoryQueries_1.EXIST_DAILY_STATS_BY_USER_ID,
            values: [params.userId],
        };
        return this.exists(query);
    }
    async getByUserIdAndDate(userId, date) {
        const query = {
            name: 'getDailyStatByUserIdAndDate',
            text: `
        SELECT id, cards_reviewed, goal_achieved, daily_goal FROM users.daily_stats 
        WHERE user_id = $1 AND date = $2
      `,
            values: [userId, date],
        };
        return this.getItem(query);
    }
    async incrementCardsReviewed(id) {
        const query = {
            name: 'incrementDailyStatCards',
            text: `
        UPDATE users.daily_stats 
        SET 
          cards_reviewed = cards_reviewed + 1,
          goal_achieved = (cards_reviewed + 1) >= daily_goal,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1;
      `,
            values: [id],
        };
        return this.updateItems(query);
    }
    async getLastByUserId(userId) {
        const query = {
            name: 'getLastDailyStatsByUserId',
            text: DailyStatsRepositoryQueries_1.GET_LAST_DAILY_STATS_BY_USER_ID,
            values: [userId],
        };
        return this.getItem(query);
    }
    async create(params) {
        const query = {
            name: 'createDailyStat',
            text: `
        INSERT INTO users.daily_stats 
          (user_id, date, cards_reviewed, daily_goal, goal_achieved)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
            values: [
                params.userId,
                params.date,
                params.cardsReviewed,
                params.dailyGoal,
                params.goalAchieved,
            ],
        };
        return this.insertItem(query);
    }
    async getUsersWithActivityOnDate(date) {
        const query = {
            name: 'getUsersWithActivityOnDate',
            text: `
        SELECT DISTINCT user_id
        FROM users.daily_stats 
        WHERE date = $1 AND cards_reviewed > 0
      `,
            values: [date],
        };
        return this.getItems(query);
    }
    async getLastStudyDate(userId) {
        const query = {
            name: 'getLastStudyDate',
            text: `
        SELECT MAX(date) as last_date
        FROM users.daily_stats 
        WHERE user_id = $1 
          AND cards_reviewed > 0
          AND date < CURRENT_DATE
      `,
            values: [userId],
        };
        const result = await this.getItem(query);
        return result?.last_date ? new Date(result.last_date) : null;
    }
}
exports.DailyStatsRepository = DailyStatsRepository;
exports.default = new DailyStatsRepository();
