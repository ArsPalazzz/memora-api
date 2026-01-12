import Table from '../Table';
import { Query } from '../../index';
import {
  GET_USER_CARD_SRS,
  GET_USERS_WITH_DUE_CARDS,
  UPSERT_USER_CARDS_SRS,
} from './UserCardSrsRepositoryQueries';

export class UserCardSrsRepository extends Table {
  async get(userSub: string, cardSub: string) {
    const query: Query = {
      name: 'getUserCardSrs',
      text: GET_USER_CARD_SRS,
      values: [userSub, cardSub],
    };

    return this.getItem(query);
  }

  async upsert(params: {
    userSub: string;
    cardSub: string;
    repetitions: number;
    intervalMinutes: number;
    easeFactor: number;
    nextReview: Date;
  }) {
    const { userSub, cardSub, repetitions, intervalMinutes, easeFactor, nextReview } = params;

    const query: Query = {
      name: 'upsertUserCardSrs',
      text: UPSERT_USER_CARDS_SRS,
      values: [userSub, cardSub, repetitions, intervalMinutes, easeFactor, nextReview],
    };

    return this.updateItems(query);
  }

  async getUsersWithDueCards() {
    const query: Query = {
      name: 'getUsersWithDueCards',
      text: GET_USERS_WITH_DUE_CARDS,
      values: [],
    };

    return this.getItems<{ user_sub: string; due_count: number }>(query);
  }
}

export default new UserCardSrsRepository();
