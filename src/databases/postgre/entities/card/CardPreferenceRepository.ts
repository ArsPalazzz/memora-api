import Table from '../Table';
import { Query } from '../../index';

export class CardPreferenceRepository extends Table {
  async getShownCardsForSession(userSub: string, sessionId: string) {
    const query: Query = {
      name: 'getShownCardsForSession',
      text: `
      SELECT DISTINCT sc.card_sub, sc.created_at
    FROM games.session_card sc
    JOIN games.session s ON s.id = sc.session_id
    WHERE s.user_sub = $1 AND s.id = $2
    ORDER BY sc.created_at DESC
    LIMIT 100;
    `,
      values: [userSub, sessionId],
    };

    return this.getItems<{ card_sub: string }>(query);
  }

  async checkIfRecordExists(userSub: string, cardSub: string): Promise<boolean> {
    const query: Query = {
      name: 'checkIfRecordExists',
      text: `SELECT 1 FROM cards.user_card_preferences WHERE user_sub = $1 AND card_sub = $2 LIMIT 1;`,
      values: [userSub, cardSub],
    };

    const result = await this.getItem<{ exists: number }>(query);
    return !!result;
  }

  async insertAction({
    userSub,
    cardSub,
    action,
  }: {
    userSub: string;
    cardSub: string;
    action: string;
  }) {
    const query: Query = {
      name: 'insertAction',
      text: `INSERT INTO cards.user_card_preferences (user_sub, card_sub, action, shown_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP);`,
      values: [userSub, cardSub, action],
    };

    return this.insertItem(query);
  }

  async updateAction({
    userSub,
    cardSub,
    action,
  }: {
    userSub: string;
    cardSub: string;
    action: string;
  }) {
    const query: Query = {
      name: 'updateAction',
      text: `UPDATE cards.user_card_preferences SET action = $3, shown_at = CURRENT_TIMESTAMP WHERE user_sub = $1 AND card_sub = $2;`,
      values: [userSub, cardSub, action],
    };

    return this.updateItems(query);
  }
}

export default new CardPreferenceRepository();
