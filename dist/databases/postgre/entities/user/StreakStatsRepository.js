"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreakStatsRepository = void 0;
const Table_1 = __importDefault(require("../Table"));
const StreakStatsRepositoryQueries_1 = require("./StreakStatsRepositoryQueries");
class StreakStatsRepository extends Table_1.default {
    async insert(params) {
        const query = {
            name: 'insertStreakStats',
            text: StreakStatsRepositoryQueries_1.INSERT_STREAK_STATS,
            values: [params.userId],
        };
        return this.insertItem(query);
    }
    async getByUserId(userId) {
        const query = {
            name: 'getStreakStatsByUserId',
            text: StreakStatsRepositoryQueries_1.GET_STREAK_STATS_BY_USER_ID,
            values: [userId],
        };
        return this.getItem(query);
    }
    async incrementStreak(userId) {
        const query = {
            name: 'incrementStreak',
            text: `
        UPDATE users.streak_stats 
        SET 
          current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING current_streak, longest_streak
      `,
            values: [userId],
        };
        return this.insertItem(query);
    }
    async resetStreak(userId) {
        const query = {
            name: 'resetStreak',
            text: `
        UPDATE users.streak_stats 
        SET 
          current_streak = 1,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING current_streak, longest_streak
      `,
            values: [userId],
        };
        return this.insertItem(query);
    }
}
exports.StreakStatsRepository = StreakStatsRepository;
exports.default = new StreakStatsRepository();
