import Table from '../Table';
import { Query } from '../../index';
import {
  ACCEPT_FRIENDSHIP,
  DELETE_FRIENDSHIP,
  DELETE_PENDING_FRIENDSHIP,
  GET_ACCEPTED_FRIENDS,
  GET_FRIENDS_ACTIVITY,
  GET_FRIENDSHIP_BETWEEN,
  GET_INCOMING_FRIEND_REQUESTS,
  GET_WEEKLY_LEAGUE,
  INSERT_FRIENDSHIP,
  ARE_ACCEPTED_FRIENDS,
} from './FriendshipRepositoryQueries';

export class FriendshipRepository extends Table {
  async createRequest(requesterSub: string, addresseeSub: string): Promise<void> {
    const query: Query = {
      name: 'insertFriendshipRequest',
      text: INSERT_FRIENDSHIP,
      values: [requesterSub, addresseeSub],
    };

    await this.runQuery(query);
  }

  async getBetween(userSub: string, otherSub: string) {
    const query: Query = {
      name: 'getFriendshipBetween',
      text: GET_FRIENDSHIP_BETWEEN,
      values: [userSub, otherSub],
    };

    return this.getItem<{
      requester_sub: string;
      addressee_sub: string;
      status: 'pending' | 'accepted';
      created_at: string;
    }>(query);
  }

  async accept(requesterSub: string, addresseeSub: string): Promise<boolean> {
    const query: Query = {
      name: 'acceptFriendship',
      text: ACCEPT_FRIENDSHIP,
      values: [requesterSub, addresseeSub],
    };

    const result = await this.runQueryWithResult(query);
    return (result.rowCount ?? 0) > 0;
  }

  async deletePending(requesterSub: string, addresseeSub: string): Promise<boolean> {
    const query: Query = {
      name: 'deletePendingFriendship',
      text: DELETE_PENDING_FRIENDSHIP,
      values: [requesterSub, addresseeSub],
    };

    return (await this.updateItems(query)) > 0;
  }

  async deleteBetween(userSub: string, otherSub: string): Promise<boolean> {
    const query: Query = {
      name: 'deleteFriendship',
      text: DELETE_FRIENDSHIP,
      values: [userSub, otherSub],
    };

    return (await this.updateItems(query)) > 0;
  }

  async getIncomingRequests(userSub: string) {
    const query: Query = {
      name: 'getIncomingFriendRequests',
      text: GET_INCOMING_FRIEND_REQUESTS,
      values: [userSub],
    };

    return this.getItems<{ sub: string; nickname: string; avatar_key: string | null }>(query);
  }

  async getAcceptedFriends(userSub: string) {
    const query: Query = {
      name: 'getAcceptedFriends',
      text: GET_ACCEPTED_FRIENDS,
      values: [userSub],
    };

    return this.getItems<{ sub: string; nickname: string; avatar_key: string | null }>(query);
  }

  async getFriendsActivity(userSub: string) {
    const query: Query = {
      name: 'getFriendsActivity',
      text: GET_FRIENDS_ACTIVITY,
      values: [userSub],
    };

    return this.getItems<{
      nickname: string;
      avatar_key: string | null;
      cards_reviewed: number;
      daily_goal: number;
      goal_achieved: boolean;
      current_streak: number;
    }>(query);
  }

  async areAcceptedFriends(userSub: string, otherSub: string): Promise<boolean> {
    if (userSub === otherSub) {
      return false;
    }

    const query: Query = {
      name: 'areAcceptedFriends',
      text: ARE_ACCEPTED_FRIENDS,
      values: [userSub, otherSub],
    };

    const row = await this.getItem<{ are_friends: boolean }>(query);
    return row?.are_friends ?? false;
  }

  async getWeeklyLeague(userSub: string) {
    const query: Query = {
      name: 'getWeeklyLeague',
      text: GET_WEEKLY_LEAGUE,
      values: [userSub],
    };

    return this.getItems<{
      week_start: string;
      week_end: string;
      nickname: string;
      avatar_key: string | null;
      is_me: boolean;
      cards_reviewed: number;
      goals_hit: number;
      current_streak: number;
    }>(query);
  }
}

export default new FriendshipRepository();
