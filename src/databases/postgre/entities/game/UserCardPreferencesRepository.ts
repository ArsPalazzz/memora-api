import Table, { PgTransaction } from '../Table';
import { Query } from '../../index';

export class UserCardPreferencesRepository extends Table {
  async recordCardShown(userSub: string, cardSub: string) {
    const query: Query = {
      name: 'recordCardShown',
      text: `
        INSERT INTO cards.user_card_preferences (user_sub, card_sub, action, shown_at)
        VALUES ($1, $2, 'shown', NOW())
        ON CONFLICT (user_sub, card_sub) 
        DO UPDATE SET 
          action = EXCLUDED.action,
          shown_at = EXCLUDED.shown_at
      `,
      values: [userSub, cardSub],
    };

    return this.updateItems(query);
  }

  async recordCardAction(userSub: string, cardSub: string, action: 'shown' | 'liked' | 'answered') {
    const query: Query = {
      name: 'recordCardAction',
      text: `
        INSERT INTO cards.user_card_preferences (user_sub, card_sub, action, shown_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (user_sub, card_sub) 
        DO UPDATE SET 
          action = EXCLUDED.action,
          shown_at = EXCLUDED.shown_at
      `,
      values: [userSub, cardSub, action],
    };

    return this.updateItems(query);
  }

  async getLikedCards(userSub: string, limit = 50) {
    const query: Query = {
      name: 'getLikedCards',
      text: `
        SELECT card_sub 
        FROM cards.user_card_preferences 
        WHERE user_sub = $1 AND action = 'liked'
        ORDER BY shown_at DESC
        LIMIT $2
      `,
      values: [userSub, limit],
    };

    const result = await this.getItems<{ card_sub: string }>(query);
    return result.map((row) => row.card_sub);
  }

  async getRecentShownCards(userSub: string, days = 7) {
    const query: Query = {
      name: 'getRecentShownCards',
      text: `
        SELECT card_sub 
        FROM cards.user_card_preferences 
        WHERE user_sub = $1 
          AND shown_at > NOW() - INTERVAL '${days} days'
      `,
      values: [userSub],
    };

    const result = await this.getItems<{ card_sub: string }>(query);
    return result.map((row) => row.card_sub);
  }
}

export default new UserCardPreferencesRepository();
