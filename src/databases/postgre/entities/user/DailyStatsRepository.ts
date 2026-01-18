import { Query } from '../..';
import { ExistDailyStatsByUserIdParams } from '../../../../services/users/user.interfaces';
import Table from '../Table';
import {
  EXIST_DAILY_STATS_BY_USER_ID,
  GET_LAST_DAILY_STATS_BY_USER_ID,
} from './DailyStatsRepositoryQueries';

export class DailyStatsRepository extends Table {
  async existByUserId(params: ExistDailyStatsByUserIdParams) {
    const query: Query = {
      name: 'existDailyStatsByUserId',
      text: EXIST_DAILY_STATS_BY_USER_ID,
      values: [params.userId],
    };

    return this.exists(query);
  }

  async getByUserIdAndDate(userId: number, date: string) {
    const query: Query = {
      name: 'getDailyStatByUserIdAndDate',
      text: `
        SELECT id, cards_reviewed, goal_achieved, daily_goal FROM users.daily_stats 
        WHERE user_id = $1 AND date = $2
      `,
      values: [userId, date],
    };

    return this.getItem<{
      id: number;
      cards_reviewed: number;
      daily_goal: number;
      goal_achieved: boolean;
    }>(query);
  }

  async incrementCardsReviewed(id: number) {
    const query: Query = {
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

  async getLastByUserId(userId: number) {
    const query: Query = {
      name: 'getLastDailyStatsByUserId',
      text: GET_LAST_DAILY_STATS_BY_USER_ID,
      values: [userId],
    };

    return this.getItem<{
      date: string;
      cards_reviewed: number;
      daily_goal: number;
      goal_achieved: boolean;
    }>(query);
  }

  async create(params: {
    userId: number;
    date: string;
    cardsReviewed: number;
    dailyGoal: number;
    goalAchieved: boolean;
  }) {
    const query: Query = {
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
    return this.insertItem<number>(query);
  }

  async getUsersWithActivityOnDate(date: string) {
    const query: Query = {
      name: 'getUsersWithActivityOnDate',
      text: `
        SELECT DISTINCT user_id
        FROM users.daily_stats 
        WHERE date = $1 AND cards_reviewed > 0
      `,
      values: [date],
    };
    return this.getItems<{ user_id: number }>(query);
  }

  async getLastStudyDate(userId: number) {
    const query: Query = {
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
    const result = await this.getItem<{ last_date: string }>(query);
    return result?.last_date ? new Date(result.last_date) : null;
  }

  async getStatsForDate(userId: number, yesterdayStr: string) {
    const query: Query = {
      name: 'getStatsForDate',
      text: `
       SELECT goal_achieved
        FROM users.daily_stats
        WHERE user_id = $1
          AND date = $2
          AND cards_reviewed > 0;
      `,
      values: [userId, yesterdayStr],
    };

    return await this.getItem<{ goal_achieved: boolean }>(query);
  }
}

export default new DailyStatsRepository();
