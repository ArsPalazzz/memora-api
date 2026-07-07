import Table from '../Table';
import { Query } from '../../index';
import { GET_CHALLENGE_LEADERBOARD, GET_AUTO_WEEKLY_CHALLENGE_DESK } from './ChallengeRepositoryQueries';

export class ChallengeRepository extends Table {
  async getLeaderboard(userSub: string, sourceDeskSub: string) {
    const query: Query = {
      name: 'getChallengeLeaderboard',
      text: GET_CHALLENGE_LEADERBOARD,
      values: [userSub, sourceDeskSub],
    };

    return this.getItems<{
      nickname: string;
      is_me: boolean;
      local_desk_sub: string;
      cards_reviewed: number;
    }>(query);
  }

  async getAutoWeeklyDeskSub() {
    const query: Query = {
      name: 'getAutoWeeklyChallengeDesk',
      text: GET_AUTO_WEEKLY_CHALLENGE_DESK,
      values: [],
    };

    const row = await this.getItem<{ sub: string }>(query);
    return row?.sub ?? null;
  }
}

export default new ChallengeRepository();
