import { Query } from '../..';
import {
  CreateUserParams,
  GetInfoByEmailRes,
  GetProfileBySubRes,
  GetProfileIdBySubRes,
} from '../../../../services/users/user.interfaces';
import Table from '../Table';
import { INSERT_USER, GET_PUBLIC_PROFILE_BY_NICKNAME, EXISTS_BY_NICKNAME, SEARCH_USERS_BY_NICKNAME_PREFIX, UPDATE_STATS_PUBLIC, UPDATE_LEAGUE_NOTIFICATIONS, GET_LEAGUE_NOTIFICATION_STATE, UPDATE_LEAGUE_NOTIFICATION_STATE, MARK_LEAGUE_NOTIFIED_TODAY, GET_USERS_FOR_LEAGUE_NOTIFICATIONS } from './UserRepositoryQueries';

export class UserRepository extends Table {
  async createUser(params: CreateUserParams) {
    const { sub, nickname, email, role, passwordHash } = params;

    const query: Query = {
      name: 'createUser',
      text: INSERT_USER,
      values: [sub, nickname, email, role, passwordHash],
    };

    return this.insertItem<number>(query, 'id');
  }

  async existByEmail(email: string) {
    const query: Query = {
      name: 'existByEmail',
      text: `SELECT EXISTS (SELECT 1 FROM users.profile WHERE email = $1 LIMIT 1);`,
      values: [email],
    };

    return this.exists(query);
  }

  async existsByNickname(nickname: string) {
    const query: Query = {
      name: 'existsByNickname',
      text: EXISTS_BY_NICKNAME,
      values: [nickname],
    };

    return this.exists(query);
  }

  async existBySub(sub: string) {
    const query: Query = {
      name: 'existProfileBySub',
      text: `SELECT EXISTS (SELECT 1 FROM users.profile WHERE sub = $1 LIMIT 1);`,
      values: [sub],
    };

    return this.exists(query);
  }

  async getProfileBySub(sub: string) {
    const query: Query = {
      name: 'getProfileBySub',
      text: `SELECT sub, nickname, email, created_at, stats_public, league_notifications FROM users.profile WHERE sub = $1 LIMIT 1;`,
      values: [sub],
    };

    return this.getItem<GetProfileBySubRes>(query);
  }

  async getProfileIdBySub(sub: string) {
    const query: Query = {
      name: 'getProfileIdBySub',
      text: `SELECT id FROM users.profile WHERE sub = $1 LIMIT 1;`,
      values: [sub],
    };

    return this.getItem<GetProfileIdBySubRes>(query);
  }

  async getInfoByEmail(email: string) {
    const query: Query = {
      name: 'getProfileByEmail',
      text: `SELECT id, sub, role, pass_hash FROM users.profile WHERE email = $1 LIMIT 1;`,
      values: [email],
    };

    return this.getItem<GetInfoByEmailRes>(query);
  }

  async getAllUserIds() {
    const query: Query = {
      name: 'getProfileByEmail',
      text: `SELECT id FROM users.profile;`,
      values: [],
    };

    const res = await this.getItems<{ id: number }>(query);
    return res.map((item) => item.id);
  }

  async searchByNicknamePrefix(prefix: string, excludeSub: string) {
    const query: Query = {
      name: 'searchUsersByNicknamePrefix',
      text: SEARCH_USERS_BY_NICKNAME_PREFIX,
      values: [prefix, excludeSub],
    };

    return this.getItems<{ sub: string; nickname: string }>(query);
  }

  async getPublicProfileByNickname(nickname: string) {
    const query: Query = {
      name: 'getPublicProfileByNickname',
      text: GET_PUBLIC_PROFILE_BY_NICKNAME,
      values: [nickname],
    };

    return this.getItem<{
      sub: string;
      nickname: string;
      created_at: string;
      stats_public: boolean;
    }>(query);
  }

  async updateStatsPublic(userSub: string, statsPublic: boolean): Promise<void> {
    const query: Query = {
      name: 'updateStatsPublic',
      text: UPDATE_STATS_PUBLIC,
      values: [userSub, statsPublic],
    };

    await this.updateItems(query);
  }

  async updateLeagueNotifications(userSub: string, enabled: boolean): Promise<void> {
    const query: Query = {
      name: 'updateLeagueNotifications',
      text: UPDATE_LEAGUE_NOTIFICATIONS,
      values: [userSub, enabled],
    };

    await this.updateItems(query);
  }

  async getLeagueNotificationState(userSub: string) {
    const query: Query = {
      name: 'getLeagueNotificationState',
      text: GET_LEAGUE_NOTIFICATION_STATE,
      values: [userSub],
    };

    return this.getItem<{
      league_notifications: boolean;
      league_last_rank: number | null;
      league_last_week_start: string | null;
      league_last_notified_date: string | null;
    }>(query);
  }

  async updateLeagueNotificationState(
    userSub: string,
    params: {
      lastRank: number | null;
      weekStart: string;
      notifiedDate?: string | null;
    }
  ): Promise<void> {
    const query: Query = {
      name: 'updateLeagueNotificationState',
      text: UPDATE_LEAGUE_NOTIFICATION_STATE,
      values: [userSub, params.lastRank, params.weekStart, params.notifiedDate ?? null],
    };

    await this.updateItems(query);
  }

  async markLeagueNotifiedToday(userSub: string, date: string): Promise<void> {
    const query: Query = {
      name: 'markLeagueNotifiedToday',
      text: MARK_LEAGUE_NOTIFIED_TODAY,
      values: [userSub, date],
    };

    await this.updateItems(query);
  }

  async getUsersForLeagueNotifications() {
    const query: Query = {
      name: 'getUsersForLeagueNotifications',
      text: GET_USERS_FOR_LEAGUE_NOTIFICATIONS,
      values: [],
    };

    return this.getItems<{ sub: string }>(query);
  }
}

export default new UserRepository();
