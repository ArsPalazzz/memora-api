import Table from '../Table';
import { Query } from '../../index';

export class UserCardSrsRepository extends Table {
  async get(userSub: string, cardSub: string) {
    const query: Query = {
      name: 'getUserCardSrs',
      text: `
      SELECT *
      FROM cards.user_card_srs
      WHERE user_sub = $1 AND card_sub = $2
    `,
      values: [userSub, cardSub],
    };

    return this.getItem(query);
  }

  async upsert(params: {
    userSub: string;
    cardSub: string;
    repetitions: number;
    intervalDays: number;
    easeFactor: number;
    nextReview: Date;
  }) {
    const { userSub, cardSub, repetitions, intervalDays, easeFactor, nextReview } = params;

    const query: Query = {
      name: 'upsertUserCardSrs',
      text: `
      INSERT INTO cards.user_card_srs (
        user_sub,
        card_sub,
        repetitions,
        interval_days,
        ease_factor,
        last_review,
        next_review
      )
      VALUES ($1,$2,$3,$4,$5,NOW(),$6)
      ON CONFLICT (user_sub, card_sub)
      DO UPDATE SET
        repetitions = $3,
        interval_days = $4,
        ease_factor = $5,
        last_review = NOW(),
        next_review = $6
    `,
      values: [userSub, cardSub, repetitions, intervalDays, easeFactor, nextReview],
    };

    return this.updateItems(query);
  }
}

export default new UserCardSrsRepository();
