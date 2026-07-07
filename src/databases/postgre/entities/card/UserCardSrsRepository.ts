import Table from '../Table';
import { Query } from '../../index';
import {
  GET_DUE_COUNT_BY_DESK,
  GET_DUE_COUNT_FOR_USER,
  GET_USER_CARD_SRS,
  GET_USERS_WITH_DUE_CARDS,
  UPSERT_USER_CARDS_SRS,
} from './UserCardSrsRepositoryQueries';

interface CreateOrUpdateSrsParams {
  userSub: string;
  cardSub: string;
  repetitions?: number;
  intervalMinutes?: number;
  easeFactor?: number;
  nextReview?: Date;
}

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

  async createOrUpdate(params: CreateOrUpdateSrsParams) {
    const {
      userSub,
      cardSub,
      repetitions = 0,
      intervalMinutes = 0,
      easeFactor = 2.5,
      nextReview = new Date(),
    } = params;

    const query: Query = {
      name: 'createOrUpdateSrs',
      text: `
        INSERT INTO cards.user_card_srs 
          (user_sub, card_sub, repetitions, interval_minutes, ease_factor, next_review, last_review)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (user_sub, card_sub) 
        DO UPDATE SET
          repetitions = EXCLUDED.repetitions,
          interval_minutes = EXCLUDED.interval_minutes,
          ease_factor = EXCLUDED.ease_factor,
          next_review = EXCLUDED.next_review,
          last_review = NOW()
      `,
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

  async getDueCountForUser(userSub: string): Promise<number> {
    const query: Query = {
      name: 'getDueCountForUser',
      text: GET_DUE_COUNT_FOR_USER,
      values: [userSub],
    };

    const row = await this.getItem<{ due_count: number }>(query);
    return row?.due_count ?? 0;
  }

  async getDueCountByDesk(
    userSub: string
  ): Promise<Array<{ desk_sub: string; title: string; due_count: number }>> {
    const query: Query = {
      name: 'getDueCountByDesk',
      text: GET_DUE_COUNT_BY_DESK,
      values: [userSub],
    };

    return this.getItems<{ desk_sub: string; title: string; due_count: number }>(query);
  }
}

export default new UserCardSrsRepository();
