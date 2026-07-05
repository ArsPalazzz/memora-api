import { Query } from '../..';
import { CreateStreakStatsParams } from '../../../../services/users/user.interfaces';
import Table from '../Table';
import { GET_STREAK_STATS_BY_USER_ID, INSERT_STREAK_STATS } from './StreakStatsRepositoryQueries';

export class StreakStatsRepository extends Table {
  async insert(params: CreateStreakStatsParams) {
    const query: Query = {
      name: 'insertStreakStats',
      text: INSERT_STREAK_STATS,
      values: [params.userId],
    };

    return this.insertItem<number>(query);
  }

  async getByUserId(userId: number) {
    const query: Query = {
      name: 'getStreakStatsByUserId',
      text: GET_STREAK_STATS_BY_USER_ID,
      values: [userId],
    };

    return this.getItem<{
      current_streak: number;
      longest_streak: number;
      last_streak_processed_date: string | null;
    }>(query);
  }

  async markStreakProcessed(userId: number, processedDate: string) {
    const query: Query = {
      name: 'markStreakProcessed',
      text: `
        UPDATE users.streak_stats
        SET
          last_streak_processed_date = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `,
      values: [userId, processedDate],
    };

    return this.updateItems(query);
  }

  async incrementStreak(userId: number) {
    const query: Query = {
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
    return this.insertItem<{ current_streak: number; longest_streak: number }>(query);
  }

  async resetStreak(userId: number) {
    const query: Query = {
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
    return this.insertItem<{ current_streak: number; longest_streak: number }>(query);
  }
}

export default new StreakStatsRepository();
